"use client";

import { LocalAccountSigner, polygonAmoy } from "@alchemy/aa-core";
import { createModularAccountAlchemyClient } from "@alchemy/aa-alchemy";
import { generatePrivateKey } from "viem/accounts";
import { SmartAccountTransactionResult } from "@/type/general";

const OWNER_KEY_PREFIX = "fr33.embeddedWallet.ownerKey";
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 450;
const inFlightUserOpByUserId = new Set<number>();

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normaliseErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const errWithFields = error as Error & {
      code?: string | number;
      details?: string;
      shortMessage?: string;
      cause?: unknown;
    };

    const parts = [
      errWithFields.message,
      errWithFields.shortMessage,
      errWithFields.details,
      errWithFields.code ? `code=${String(errWithFields.code)}` : "",
      errWithFields.cause instanceof Error ? errWithFields.cause.message : "",
    ].filter(Boolean);

    return parts.join(" | ");
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function isRetryableAAError(error: unknown): boolean {
  const msg = normaliseErrorMessage(error).toLowerCase();

  return [
    "getcounterfactualaddress failed",
    "failed to fetch",
    "network",
    "timeout",
    "temporarily unavailable",
    "429",
    "503",
    "gateway",
    "rate limit",
    "socket hang up",
    "invalid url",
  ].some((needle) => msg.includes(needle));
}

async function withTransientRetry<T>(
  label: string,
  task: () => Promise<T>,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      return await task();
    } catch (error) {
      lastError = error;

      if (attempt >= MAX_RETRY_ATTEMPTS || !isRetryableAAError(error)) {
        break;
      }

      const backoff = RETRY_BASE_DELAY_MS * attempt;
      console.warn(
        `[embedded-wallet] ${label} attempt ${attempt} failed, retrying in ${backoff}ms: ${normaliseErrorMessage(
          error,
        )}`,
      );
      await delay(backoff);
    }
  }

  throw lastError;
}

function getStorageKey(userId: number) {
  return `${OWNER_KEY_PREFIX}.${userId}`;
}

// Note: This client is designed for demonstration purposes and should not be used in
// production without proper security considerations, such as encrypting the private key
// and implementing a secure recovery mechanism.
function getPublicAlchemyConfig() {
  const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  const gasPolicyId = process.env.NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID;

  if (!apiKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_ALCHEMY_API_KEY. Embedded wallet client cannot initialize.",
    );
  }

  if (!gasPolicyId) {
    throw new Error(
      "Missing NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID. Embedded wallet client cannot initialize.",
    );
  }

  return { apiKey, gasPolicyId };
}

// Generate and store the owner's private key for the embedded wallet.
// This should be done once per user and the key should be securely stored on the client side.
function readOwnerPrivateKey(userId: number): `0x${string}` | null {
  if (typeof window === "undefined") return null;
  const existing = window.localStorage.getItem(getStorageKey(userId));
  if (!existing) return null;
  return existing as `0x${string}`;
}

// Store the owner's private key in local storage.
// TODO: Encrypt the key before storing and implement a secure recovery mechanism.
function persistOwnerPrivateKey(
  userId: number,
  ownerPrivateKey: `0x${string}`,
) {
  if (typeof window === "undefined") {
    throw new Error("Embedded wallet storage requires a browser environment");
  }

  window.localStorage.setItem(getStorageKey(userId), ownerPrivateKey);
}

// Clear the stored private key
async function buildClient(ownerPrivateKey: `0x${string}`) {
  const signer = LocalAccountSigner.privateKeyToAccountSigner(ownerPrivateKey);
  const { apiKey, gasPolicyId } = getPublicAlchemyConfig();

  return createModularAccountAlchemyClient({
    apiKey,
    chain: polygonAmoy,
    signer,
    gasManagerConfig: {
      policyId: gasPolicyId,
    },
  });
}

// Create an embedded wallet for the user if one doesn't already exist, and return the wallet address.
export async function createEmbeddedWalletForUser(userId: number): Promise<{
  address: string;
  alreadyExists: boolean;
}> {
  const existing = readOwnerPrivateKey(userId);
  const ownerPrivateKey = existing ?? generatePrivateKey();

  if (!existing) {
    persistOwnerPrivateKey(userId, ownerPrivateKey);
  }

  const client = await withTransientRetry("build wallet client", () =>
    buildClient(ownerPrivateKey),
  );
  const address = await withTransientRetry("derive smart account address", async () =>
    client.getAddress(),
  );

  return {
    address,
    alreadyExists: Boolean(existing),
  };
}

// Clear the embedded wallet for the user (e.g. on logout or wallet reset)
export async function sendEmbeddedSmartAccountTransactionForUser(params: {
  userId: number;
  expectedSmartAccountAddress: string;
  target: `0x${string}`;
  data: `0x${string}`;
  value: string;
  summary: string;
}): Promise<SmartAccountTransactionResult> {
  if (inFlightUserOpByUserId.has(params.userId)) {
    return {
      success: false,
      errorMsg:
        "Another blockchain action is already being processed for this account. Please wait a moment and retry.",
      txHash: "" as `0x${string}`,
      userOpHash: "" as `0x${string}`,
    };
  }

  const ownerPrivateKey = readOwnerPrivateKey(params.userId);

  if (!ownerPrivateKey) {
    return {
      success: false,
      errorMsg:
        "No embedded wallet key found on this device. Re-run wallet creation or recover your wallet.",
      txHash: "" as `0x${string}`,
      userOpHash: "" as `0x${string}`,
    };
  }

  const approval = window.confirm(
    `Approve blockchain action?\n\n${params.summary}\n\nTarget: ${params.target}`,
  );

  if (!approval) {
    return {
      success: false,
      errorMsg: "Transaction rejected by user",
      txHash: "" as `0x${string}`,
      userOpHash: "" as `0x${string}`,
    };
  }

  inFlightUserOpByUserId.add(params.userId);

  try {
    const client = await withTransientRetry("build transaction client", () =>
      buildClient(ownerPrivateKey),
    );
    const currentAddress = await withTransientRetry(
      "resolve smart account address",
      async () => client.getAddress(),
    );

    if (
      currentAddress.toLowerCase() !==
      params.expectedSmartAccountAddress.toLowerCase()
    ) {
      throw new Error(
        "Embedded signer on this device does not match your linked wallet address",
      );
    }

    const result = await withTransientRetry("send user operation", () =>
      client.sendUserOperation({
        uo: {
          target: params.target,
          data: params.data,
          value: BigInt(params.value),
        },
      }),
    );

    const txHash = await withTransientRetry(
      "wait for user operation transaction",
      () =>
        client.waitForUserOperationTransaction({
          hash: result.hash,
        }),
    );

    return {
      success: true,
      txHash,
      userOpHash: result.hash,
    };
  } catch (error) {
    return {
      success: false,
      errorMsg: normaliseErrorMessage(error),
      txHash: "" as `0x${string}`,
      userOpHash: "" as `0x${string}`,
    };
  } finally {
    inFlightUserOpByUserId.delete(params.userId);
  }
}
