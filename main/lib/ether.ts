import { ESCROW_ABI, POL_TO_SGD_RATE } from "@/utils/constants";
import { ethers } from "ethers";

export const ESCROW_CONTRACT_ADDRESS =
  process.env.NEXT_ESCROW_CONTRACT_ADDRESS!;
const PRIVATE_KEY = process.env.NEXT_ADMIN_PRIVATE_KEY!;
const RPC_URL = process.env.NEXT_RPC_URL!;

export function getProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

export async function getContract(
  signerOrProvider: ethers.Provider | ethers.Signer,
) {
  try {
    return new ethers.Contract(
      ESCROW_CONTRACT_ADDRESS,
      ESCROW_ABI,
      signerOrProvider,
    );
  } catch (error) {
    throw new Error(
      "Error connecting to JobEscrow contract: " + (error as Error).message,
    );
  }
}

export function getAdminSigner() {
  const provider = getProvider();
  return new ethers.Wallet(PRIVATE_KEY, provider);
}

export function parseSGDToPolygon(amountInSGD: string): bigint {
  // TODO: Sync to actual exchange rate
  return ethers.parseEther(
    (parseFloat(amountInSGD) * POL_TO_SGD_RATE).toString(),
  );
}
