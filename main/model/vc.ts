import { prisma } from "@/lib/db";
import { VCData } from "@/types";
import { VCStatus } from "@/generated/prisma-client";

export async function createVCMetadata(
  vcData: VCData,
  walletId: number
): Promise<void> {
  try {
    await prisma.vCMetadata.create({
      data: {
        vcHash: vcData.vcHash,
        issuedAt: new Date(vcData.issuedAt),
        expiresAt: new Date(vcData.expiresAt),
        issuerDid: vcData.issuerDid,
        status: VCStatus.VALID,
        walletId,
      },
    });
  } catch (error) {
    console.error("Failed to create VC metadata, err:", error);
    throw new Error("VC metadata creation failed: " + (error as Error).message);
  }
}
