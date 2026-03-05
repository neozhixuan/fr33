import { ethers } from "ethers";
import { VC_REGISTRY_ABI } from "../utils/constants";

const vcRegistryAddress = process.env.VC_REGISTRY_ADDRESS!;

function getProvider() {
  return new ethers.JsonRpcProvider(process.env.RPC_URL!);
}

export function getIssuerWallet() {
  const wallet = new ethers.Wallet(
    process.env.ISSUER_PRIVATE_KEY!,
    getProvider(),
  );
  return wallet;
}

export async function getContract() {
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
