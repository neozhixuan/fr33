import { ethers } from "ethers";
import { VC_REGISTRY_ABI } from "../utils/constants";

const vcRegistryAddress = process.env.VC_REGISTRY_ADDRESS!;

/**
 * Utilise the Polygon development network.
 * Returns a Provider which can only make read-only calls to blockchain.
 */
export function getProvider() {
  return new ethers.JsonRpcProvider(process.env.RPC_URL!);
}

/**
 * Returns the issuer signer used for EIP-712 credential authorisation signatures.
 */
export function getIssuerAuthorisationSigner() {
  return new ethers.Wallet(
    process.env.ISSUER_AUTHORISATION_PRIVATE_KEY!,
    getProvider(),
  );
}

/**
 * Fetches the VC registry contract in read-only mode.
 */
export async function getVcRegistryReadContract() {
  try {
    return new ethers.Contract(
      vcRegistryAddress,
      VC_REGISTRY_ABI,
      getProvider(),
    );
  } catch (error) {
    throw new Error(
      "Error connecting to VCRegistry contract: " + (error as Error).message,
    );
  }
}

/**
 * Fetches the VC registry contract with issuer signer for write operations.
 */
export async function getVcRegistryWriteContract() {
  try {
    return new ethers.Contract(
      vcRegistryAddress,
      VC_REGISTRY_ABI,
      getIssuerAuthorisationSigner(),
    );
  } catch (error) {
    throw new Error(
      "Error connecting to VCRegistry write contract: " +
        (error as Error).message,
    );
  }
}
