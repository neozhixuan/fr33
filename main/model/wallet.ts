import { prisma } from "@/lib/db";
import { Wallet } from "@/generated/prisma-client";

export async function getWalletByUserId(
  userId: number
): Promise<Wallet | null> {
  try {
    const wallet = await prisma.wallet.findFirst({
      where: { userId },
    });

    return wallet ?? null;
  } catch (error) {
    console.error("Failed to get wallet by user ID:", error);
    throw new Error("Failed to get wallet by user ID: " + error);
  }
}
