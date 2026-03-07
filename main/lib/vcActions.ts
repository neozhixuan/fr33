"use server";

import { IssueVCResponse } from "@/utils/types";
import { getWalletByUserId } from "@/model/wallet";
import { createVCMetadataForWallet, getValidVCForWallet } from "@/model/vc";
import { updateUserOnboardingStage } from "@/model/user";
import { OnboardingStage, Wallet } from "@/generated/prisma-client";
import { getContract, getProvider } from "./ether";
import { VC_REGISTRY_ABI } from "@/utils/constants";

const VC_REGISTRY_ADDRESS = process.env.NEXT_VC_REGISTRY_ADDRESS!;

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

  // Store the issued VC JWT
  await createVCMetadataForWallet(vcResponse, wallet);

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

  return await contract.isValid(vcHash, subjectAddress);
}
