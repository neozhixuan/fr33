import { Wallet } from "@/generated/prisma-client";
import { POL_TO_SGD_RATE } from "@/utils/constants";
import { ethers } from "ethers";

const PRIVATE_KEY = process.env.NEXT_ADMIN_PRIVATE_KEY!;
const RPC_URL = process.env.NEXT_RPC_URL!;

/**
 * Utilise the Polygon development network.
 * Returns a Provider which can only make read-only calls to blockchain.
 */
export function getProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

/**
 * Returns admin signer for backend-operated privileged contract transactions.
 */
export function getAdminSigner() {
  const normalisedPrivateKey = PRIVATE_KEY.startsWith("0x")
    ? PRIVATE_KEY
    : `0x${PRIVATE_KEY}`;
  return new ethers.Wallet(normalisedPrivateKey, getProvider());
}

/**
 * Generic function to fetch any contract given the address, abi and signer or provider.
 * @param address Address of contract
 * @param abi ABI of contract
 * @param signerOrProvider Signer or provider to use for the contract
 * @returns Promise resolving to the contract instance
 */
export async function getContract(
  address: string,
  abi: ethers.InterfaceAbi,
  signerOrProvider: ethers.Provider | ethers.Signer,
) {
  try {
    return new ethers.Contract(address, abi, signerOrProvider);
  } catch (error) {
    throw new Error(
      "Error connecting to this contract: " + (error as Error).message,
    );
  }
}

export function parseSGDToPolygon(amountInSGD: string): bigint {
  // TODO: Sync to actual exchange rate
  return ethers.parseEther(
    (parseFloat(amountInSGD) * POL_TO_SGD_RATE).toString(),
  );
}

// Retrieve a user's wallet balance in POL and format it for display
export async function getUserWalletPolygonValue(
  wallet: Wallet,
): Promise<string> {
  const provider = getProvider();
  const rawBalance = await provider.getBalance(wallet.address);
  const formatted = Number(ethers.formatEther(rawBalance));
  return `${formatted.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })} POL`;
}
