"use server";

import { createUserWalletRecord } from "@/model/user";
import { ExecutionResult } from "@/type/general";
import { getWalletByUserId } from "@/model/wallet";
import { auth } from "@/server/auth";
import { stringToInt } from "@/utils/conv";

function assertValidHexAddress(address: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

async function assertSessionUserMatches(userId: number) {
  const session = await auth();
  const sessionUserId = session?.user?.id ? stringToInt(session.user.id) : null;
  if (!sessionUserId || sessionUserId !== userId) {
    throw new Error("Unauthorized wallet operation");
  }
}

/**
 * Get the address of a user's wallet by their user ID
 * @param userId - User's ID
 * @returns The wallet address associated with the user
 */
export async function getWalletAddress(userId: number): Promise<string> {
  await assertSessionUserMatches(userId);
  const wallet = await getWalletByUserId(userId);
  if (!wallet || !wallet.address) {
    throw new Error("Wallet not found for the user");
  }
  return wallet.address;
}

/**
 * Persists embedded wallet metadata for the user.
 * Private key material must remain client-managed and never be sent to backend.
 */
export const createWallet = async (
  userId: number,
  smartAccountAddress: string,
): Promise<ExecutionResult> => {
  await assertSessionUserMatches(userId);

  if (!assertValidHexAddress(smartAccountAddress)) {
    return {
      success: false,
      errorMsg: "Invalid wallet address format",
    };
  }

  try {
    const existing = await getWalletByUserId(userId);

    if (existing?.address) {
      if (
        existing.address.toLowerCase() === smartAccountAddress.toLowerCase()
      ) {
        return { success: true };
      }

      return {
        success: false,
        errorMsg:
          "A different wallet is already linked to this user. Contact support to rotate wallet metadata.",
      };
    }

    await createUserWalletRecord(userId, smartAccountAddress);
  } catch (error) {
    console.log("[CreateWallet] Error updating user and wallet record:", error);
    return {
      success: false,
      errorMsg: "Error updating user and wallet record: " + error,
    };
  }

  return { success: true };
};
