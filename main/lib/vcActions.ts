"use server";

import {
  IssueVCResponse,
  PreparedSmartAccountTransactionResult,
} from "@/type/general";
import { getWalletByUserId } from "@/model/wallet";
import { createVCMetadataForWallet, getValidVCForWallet } from "@/model/vc";
import { updateUserOnboardingStage } from "@/model/user";
import { OnboardingStage, Wallet } from "@/generated/prisma-client";
import { getContract, getProvider } from "./ether";
import { VC_REGISTRY_ABI } from "@/utils/constants";

const VC_REGISTRY_ADDRESS = process.env.NEXT_VC_REGISTRY_ADDRESS!;

function normaliseVcHash(vcHash: string): `0x${string}` {
  const trimmed = vcHash.trim();

  if (/^0x[0-9a-fA-F]{64}$/.test(trimmed)) {
    return trimmed as `0x${string}`;
  }

  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return `0x${trimmed}` as `0x${string}`;
  }

  throw new Error("Invalid VC hash format. Expected a 32-byte hex string");
}

export async function prepareVcRegistrationAction(params: {
  userId: number;
  vcResponse: IssueVCResponse;
}): Promise<
  PreparedSmartAccountTransactionResult & { walletAddress?: string }
> {
  const { userId, vcResponse } = params;
  const registration = vcResponse.registrationAuthorisation;
  if (!registration) {
    return {
      success: false,
      errorMsg: "Missing VC registration authorisation payload",
    };
  }

  const wallet = await getWalletByUserId(userId);
  if (!wallet?.address) {
    return {
      success: false,
      errorMsg: "Wallet not found for the user",
    };
  }

  if (
    registration.subjectAddress.toLowerCase() !== wallet.address.toLowerCase()
  ) {
    return {
      success: false,
      errorMsg: "VC authorisation subject does not match wallet address",
    };
  }

  const contract = await getContract(
    VC_REGISTRY_ADDRESS,
    VC_REGISTRY_ABI,
    getProvider(),
  );

  const callData = contract.interface.encodeFunctionData(
    "registerCredentialWithAuthorisation",
    [
      normaliseVcHash(vcResponse.vcHash),
      wallet.address,
      BigInt(registration.expiresAt),
      BigInt(registration.nonce),
      BigInt(registration.deadline),
      registration.signature,
    ],
  );

  return {
    success: true,
    walletAddress: wallet.address,
    txRequest: {
      target: VC_REGISTRY_ADDRESS as `0x${string}`,
      data: callData as `0x${string}`,
      value: "0",
      summary: "Register VC credential on-chain",
    },
  };
}

/**
 * Handle the VC issuance response, store the issued VC, and complete the user's onboarding.
 * @param userId - The ID of the user receiving the VC
 * @param vcResponse - The response from the VC issuance process
 * @returns
 */
export async function completeVcIssuanceAction(params: {
  userId: number;
  vcResponse: IssueVCResponse;
  txHash: `0x${string}`;
}) {
  const { userId, vcResponse, txHash } = params;
  // Fetch user wallet
  const wallet = await getWalletByUserId(userId);

  if (!wallet || !wallet.address) {
    throw new Error("Wallet not found for the user");
  }

  if (!vcResponse.success) {
    throw new Error("VC issuance failed: " + vcResponse.errorMsg);
  }

  // Store the issued VC JWT + on-chain registration transaction hash
  await createVCMetadataForWallet(vcResponse, wallet, txHash);

  // Update user onboarding stage
  await updateUserOnboardingStage(userId, OnboardingStage.COMPLETED);
}

/**
 * Validates if user can perform gated action by checking VC validity
 * @param wallet - The user's wallet to check for valid VC
 */
export async function checkIsUserActionAllowed(
  wallet: Wallet,
): Promise<boolean> {
  const validVC = await getValidVCForWallet(wallet.id);

  if (!validVC) {
    console.log("No valid VC found for wallet ID:", wallet.id);
    return false;
  }

  return await checkIsVcValid(validVC.vcHash, wallet.address);
}

/**
 * Returns boolean stating if the VC is valid by checking the blockchain registry
 * @param vcHash Hash of the VC to check
 * @param subjectAddress Address of wallet that the VC was issued to
 * @returns boolean indicating if the VC is valid
 */
async function checkIsVcValid(
  vcHash: string,
  subjectAddress: string,
): Promise<boolean> {
  const contract = await getContract(
    VC_REGISTRY_ADDRESS,
    VC_REGISTRY_ABI,
    getProvider(),
  );

  // `isValid` expects bytes32. Normalise DB/API hash values to 0x-prefixed 32-byte hex.
  return await contract.isValid(normaliseVcHash(vcHash), subjectAddress);
}
