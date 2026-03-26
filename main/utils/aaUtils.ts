import { PreparedSmartAccountTransaction } from "@/type/general";
import { getContract, getProvider } from "@/lib/ether";
import { ESCROW_ABI } from "./constants";

export const ESCROW_CONTRACT_ADDRESS =
  process.env.NEXT_ESCROW_CONTRACT_ADDRESS!;

/**
 * Build an encoded escrow transaction request.
 * Signing and submission must happen client-side after explicit user approval.
 */
export async function buildEscrowTransactionRequest(params: {
  functionName: string;
  functionArgs: (string | number | bigint | boolean)[];
  amount?: bigint;
  summary: string;
}): Promise<PreparedSmartAccountTransaction> {
  const { functionName, functionArgs, amount, summary } = params;

  const contract = await getContract(
    ESCROW_CONTRACT_ADDRESS,
    ESCROW_ABI,
    getProvider(),
  );
  const callData = contract.interface.encodeFunctionData(
    functionName,
    functionArgs,
  );

  return {
    target: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    data: callData as `0x${string}`,
    value: (amount ?? BigInt(0)).toString(),
    summary,
  };
}
