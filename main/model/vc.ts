import { prisma } from "@/lib/db";
import { VCData } from "@/utils/types";
import { VCStatus, Wallet } from "@/generated/prisma-client";

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
        subjectDid: `did:ethr:polygon:${wallet.address}`,
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
