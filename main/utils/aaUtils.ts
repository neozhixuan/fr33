import { SmartAccountTransactionResult } from "@/types";
import { ESCROW_CONTRACT_ADDRESS, getContract, getProvider } from "@/lib/ether";
import { sendSmartAccountTransaction } from "@/lib/aaActions";

/**
 * Shared helper to execute job-related blockchain transactions
 * Handles job validation, contract encoding, transaction execution, and DB updates
 */
export async function executeJobTransaction(params: {
  userId: number;
  functionName: string;
  functionArgs: (string | number | bigint | boolean)[]; // `any` is not allowed
  amount?: bigint;
  onSuccess: (txHash: string) => Promise<void>;
}): Promise<SmartAccountTransactionResult> {
  const { userId, functionName, functionArgs, amount, onSuccess } = params;
  const fallbackErrorHash = "" as `0x${string}`;

  // 1. Encode contract function call
  const contract = await getContract(getProvider());
  const callData = contract.interface.encodeFunctionData(
    functionName,
    functionArgs,
  );

  // 2. Send transaction via smart account
  let txHashResult: string, userOpHashResult: string;
  try {
    const { txHash, userOpHash, success, errorMsg } =
      await sendSmartAccountTransaction(
        userId,
        ESCROW_CONTRACT_ADDRESS,
        callData,
        amount,
      );
    if (!success) {
      throw new Error("Smart account transaction failed: " + errorMsg);
    }
    txHashResult = txHash;
    userOpHashResult = userOpHash;
  } catch (error) {
    console.error(`Error executing ${functionName}:`, error);
    return {
      success: false,
      errorMsg: `Error executing ${functionName}: ${(error as Error).message}`,
      txHash: fallbackErrorHash,
      userOpHash: fallbackErrorHash,
    };
  }

  // 3. Update DB with transaction result
  try {
    await onSuccess(txHashResult);
  } catch (error) {
    console.error(`Error updating DB after ${functionName}:`, error);
    return {
      success: false,
      errorMsg: `Error updating DB after ${functionName}: ${
        (error as Error).message
      }`,
      txHash: fallbackErrorHash,
      userOpHash: fallbackErrorHash,
    };
  }

  return {
    success: true,
    txHash: txHashResult as `0x${string}`,
    userOpHash: userOpHashResult as `0x${string}`,
  };
}
