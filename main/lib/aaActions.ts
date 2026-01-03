"use server";

import { LocalAccountSigner, sepolia } from "@alchemy/aa-core";
import { createModularAccountAlchemyClient } from "@alchemy/aa-alchemy";
import { generatePrivateKey } from "viem/accounts";
import { createUserWalletRecord } from "@/model/user";
import { ExecutionResult } from "./authActions";
import { encryptPrivateKey } from "./crypto";
import { Wallet } from "@prisma/client";

export type SmartAccountDetails = Pick<
  Wallet,
  "address" | "encryptedSignerKey" | "signerKeyIv"
>;

/**
 * Creates a smart account for the user and updates the database accordingly.
 */
export const createWallet = async (
  userId: number
): Promise<ExecutionResult> => {
  // 1. Get smart account address, fail fast if error
  let smartAccountDetails: SmartAccountDetails | null = null;
  try {
    smartAccountDetails = await createSmartAccount();
    if (!smartAccountDetails) {
      throw new Error(
        "[CreateWallet] Smart account creation returned null details"
      );
    }
  } catch (error) {
    console.log("[CreateWallet] Error creating smart account:", error);
    return {
      success: false,
      error: "[CreateWallet]Error creating smart account: " + error,
    };
  }

  // 2. Create transaction to update user + wallet tables
  try {
    await createUserWalletRecord(
      userId,
      smartAccountDetails.address,
      smartAccountDetails.encryptedSignerKey,
      smartAccountDetails.signerKeyIv
    );
  } catch (error) {
    console.log("[CreateWallet] Error updating user and wallet record:", error);
    return {
      success: false,
      error: "Error updating user and wallet record: " + error,
    };
  }

  // 3. Return success
  return { success: true };
};

/**
 * Creates an ERC-4337 smart account for a user.
 * Returns both the smart account address and the owner's private key
 */
export async function createSmartAccount(): Promise<SmartAccountDetails> {
  if (!process.env.ALCHEMY_API_KEY) {
    throw new Error(
      "[createSmartAccount] Missing ALCHEMY_API_KEY in environment variables"
    );
  }

  if (!process.env.ALCHEMY_GAS_POLICY_ID) {
    throw new Error(
      "[createSmartAccount] Missing ALCHEMY_GAS_POLICY_ID in environment variables"
    );
  }

  // Generate a new EOA private key for this user
  // TODO: Replace with deterministic key derivation from user credentials
  const ownerPrivateKey = generatePrivateKey();

  // Create a signer from the private key
  const signer = LocalAccountSigner.privateKeyToAccountSigner(ownerPrivateKey);

  // Create the Alchemy client with Modular Account and Gas Manager (paymaster)
  const client = await createModularAccountAlchemyClient({
    apiKey: process.env.ALCHEMY_API_KEY,
    chain: sepolia,
    signer,
    gasManagerConfig: {
      policyId: process.env.ALCHEMY_GAS_POLICY_ID, // Smart account will be automatically deployed on first transaction
    },
  });
  const smartAccountAddress = client.getAddress();

  console.log(
    "[createSmartAccount] Smart Account created:",
    smartAccountAddress
  );
  console.log("[createSmartAccount] Owner EOA:", await signer.getAddress());

  const { ciphertext, iv } = encryptPrivateKey(ownerPrivateKey);

  return {
    address: smartAccountAddress,
    encryptedSignerKey: ciphertext,
    signerKeyIv: iv,
  };
}
