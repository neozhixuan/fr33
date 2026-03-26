"use client";

import {
  PreparedSmartAccountTransactionResult,
  SmartAccountTransactionResult,
} from "@/type/general";
import { sendEmbeddedSmartAccountTransactionForUser } from "@/lib/embeddedWalletClient";

type PrepareAndSignParams = {
  userId: number;
  walletAddress: string;
  prepare: () => Promise<PreparedSmartAccountTransactionResult>;
};

export async function prepareAndSignSmartAccountTransaction(
  params: PrepareAndSignParams,
): Promise<SmartAccountTransactionResult> {
  const prepared = await params.prepare();

  if (!prepared.success || !prepared.txRequest) {
    return {
      success: false,
      errorMsg: prepared.errorMsg || "Failed to prepare transaction",
      txHash: "" as `0x${string}`,
      userOpHash: "" as `0x${string}`,
    };
  }

  return sendEmbeddedSmartAccountTransactionForUser({
    userId: params.userId,
    expectedSmartAccountAddress: params.walletAddress,
    target: prepared.txRequest.target,
    data: prepared.txRequest.data,
    value: prepared.txRequest.value,
    summary: prepared.txRequest.summary,
  });
}
