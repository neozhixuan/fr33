"use server";

import { IssueVCResponse } from "@/utils/types";
import { getWalletByUserId } from "@/model/wallet";
import { createVCMetadataForWallet, getValidVCForWallet } from "@/model/vc";
import { updateUserOnboardingStage } from "@/model/user";
import { OnboardingStage, Wallet } from "@/generated/prisma-client";
import { getContract, getProvider } from "./ether";
import { VC_REGISTRY_ABI } from "@/utils/constants";
import { sendSmartAccountTransaction } from "./aaActions";

const VC_REGISTRY_ADDRESS = process.env.NEXT_VC_REGISTRY_ADDRESS!;

function normaliseVcHash(vcHash: string): `0x${string}` {
  const hex = vcHash.startsWith("0x") ? vcHash.slice(2) : vcHash;
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("Invalid VC hash. Expected 32-byte hex string");
  }
  return `0x${hex.toLowerCase()}`;
}

async function registerVcOnChain(
  userId: number,
  walletAddress: string,
  vcResponse: IssueVCResponse,
): Promise<string> {
  const registration = vcResponse.registrationAuthorisation;
  if (!registration) {
    throw new Error("Missing VC registration authorisation payload");
  }

  if (
    registration.subjectAddress.toLowerCase() !== walletAddress.toLowerCase()
  ) {
    throw new Error("VC authorisation subject does not match wallet address");
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
      walletAddress,
      BigInt(registration.expiresAt),
      BigInt(registration.nonce),
      BigInt(registration.deadline),
      registration.signature,
    ],
  );

  const { txHash, success, errorMsg } = await sendSmartAccountTransaction(
    userId,
    VC_REGISTRY_ADDRESS,
    callData,
  );

  if (!success || !txHash) {
    throw new Error(
      "VC on-chain registration failed: " + (errorMsg || "Unknown error"),
    );
  }

  return txHash;
}

/**
 * Handle the VC issuance response, store the issued VC, and complete the user's onboarding.
 * @param userId - The ID of the user receiving the VC
 * @param vcResponse - The response from the VC issuance process
 * @returns
 */
export async function processVcIssuance(
  userId: number,
  vcResponse: IssueVCResponse,
) {
  // Fetch user wallet
  const wallet = await getWalletByUserId(userId);

  if (!wallet || !wallet.address) {
    throw new Error("Wallet not found for the user");
  }

  if (!vcResponse.success) {
    throw new Error("VC issuance failed: " + vcResponse.errorMsg);
  }

  const txHash = await registerVcOnChain(userId, wallet.address, vcResponse);

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
export async function checkIsVcValid(
  vcHash: string,
  subjectAddress: string,
): Promise<boolean> {
  const contract = await getContract(
    VC_REGISTRY_ADDRESS,
    VC_REGISTRY_ABI,
    getProvider(),
  );

  return await contract.isValidHash(normaliseVcHash(vcHash), subjectAddress);
}
