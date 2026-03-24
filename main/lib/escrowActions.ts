import { SmartAccountTransactionResult } from "@/type/general";
import { getAdminSigner, getContract } from "./ether";
import { ESCROW_CONTRACT_ADDRESS } from "@/utils/aaUtils";
import { ESCROW_ABI } from "@/utils/constants";

/**
 * Executes admin-only escrow transactions via backend signer.
 */
export async function executeAdminEscrowTransaction(params: {
  functionName: string;
  functionArgs: (string | number | bigint | boolean)[];
}): Promise<SmartAccountTransactionResult> {
  const fallbackErrorHash = "" as `0x${string}`;

  try {
    const signer = getAdminSigner();
    const contract = await getContract(
      ESCROW_CONTRACT_ADDRESS,
      ESCROW_ABI,
      signer,
    );

    const tx = await contract[params.functionName](...params.functionArgs);
    const receipt = await tx.wait();
    if (!receipt?.hash) {
      throw new Error("No transaction hash returned from admin transaction");
    }

    return {
      success: true,
      txHash: receipt.hash as `0x${string}`,
      userOpHash: receipt.hash as `0x${string}`,
    };
  } catch (error) {
    console.error(
      `Error executing admin transaction ${params.functionName}:`,
      error,
    );
    return {
      success: false,
      errorMsg: `Error executing admin transaction ${params.functionName}: ${
        (error as Error).message
      }`,
      txHash: fallbackErrorHash,
      userOpHash: fallbackErrorHash,
    };
  }
}
