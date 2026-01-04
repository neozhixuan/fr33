"use server";

import { IssueVCResponse } from "@/types";
import { getWalletByUserId } from "@/model/wallet";
import { createVCMetadata } from "@/model/vc";
import { updateUserOnboardingStage } from "@/model/user";
import { OnboardingStage } from "@/generated/prisma-client";

export async function getWalletAddress(userId: number): Promise<string> {
  const wallet = await getWalletByUserId(userId);
  if (!wallet || !wallet.address) {
    throw new Error("Wallet not found for the user");
  }
  return wallet.address;
}

export async function processVCIssuance(
  userId: number,
  vcResponse: IssueVCResponse
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
  await createVCMetadata(vcResponse, wallet.id);

  // Update user onboarding stage
  await updateUserOnboardingStage(userId, OnboardingStage.COMPLETED);
}
