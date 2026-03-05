import { ethers } from "ethers";
import { VC_REGISTRY_ABI } from "../utils/constants";

const vcRegistryAddress = process.env.VC_REGISTRY_ADDRESS!;

/**
 * Utilise the Polygon development network.
 * Returns a Provider which can only make read-only calls to blockchain.
 */
function getProvider() {
  return new ethers.JsonRpcProvider(process.env.RPC_URL!);
}

/**
 * Returns the VC Registry wallet as a Signer which can send transactions and sign them.
 */
function getIssuerWallet() {
  return new ethers.Wallet(process.env.ISSUER_PRIVATE_KEY!, getProvider());
}

/**
 * Fetches the contract which signs fn calls using VC Registry wallet.
 */
export async function getVcRegistryContract() {
  try {
    return new ethers.Contract(
      vcRegistryAddress,
      VC_REGISTRY_ABI,
      getIssuerWallet(),
    );
  } catch (error) {
    throw new Error(
      "Error connecting to VCRegistry contract: " + (error as Error).message,
    );
  }
}
