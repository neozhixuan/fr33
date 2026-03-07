import { prisma } from "@/lib/db";
import { VCData } from "@/utils/types";
import { VCMetadata, VCStatus, Wallet } from "@/generated/prisma-client";

export async function createVCMetadataForWallet(
  vcData: VCData,
  wallet: Wallet,
): Promise<void> {
  try {
    await prisma.vCMetadata.create({
      data: {
        walletId: wallet.id,
        vcHash: vcData.vcHash,
        txHash: vcData.txHash,
        status: VCStatus.VALID,
        issuerDid: vcData.issuerDid,
        subjectDid: `did:ethr:polygon:amoy:${wallet.address}`,
        issuedAt: new Date(vcData.issuedAt),
        expiresAt: new Date(vcData.expiresAt),
        revokedAt: null,
      },
    });
  } catch (error) {
    console.error("Failed to create VC metadata, err:", error);
    throw new Error("VC metadata creation failed: " + (error as Error).message);
  }
}

// TODO: for now assume that we take the first valid VC for the wallet
/**
 * Find the first valid VC for this user's wallet and return it. If no valid VC is found, return null.
 * @param walletId
 */
export async function getValidVCForWallet(
  walletId: number,
): Promise<VCMetadata | null> {
  try {
    const validVC = await prisma.vCMetadata.findFirst({
      where: {
        walletId,
        status: VCStatus.VALID,
      },
    });

    if (!validVC) {
      throw new Error("No valid VC found for the wallet");
    }

    return validVC;
  } catch (error) {
    console.error("Error fetching valid VC for wallet:", error);
    throw new Error("Failed to fetch valid VC: " + (error as Error).message);
  }
}
