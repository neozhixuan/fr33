import { getVcRegistryContract } from "../../lib/ether";

/**
 * Creates a transaction in the chain, to verify the existing status of a VC.
 * @param vcHash - the hash of the VC to be registered
 * @param subjectAddress - the wallet address of the VC subject
 * @param expiry - the expiry timestamp of the VC (in seconds since epoch)
 * @returns the transaction hash of the blockchain transaction
 */
export async function createVcRegistryTx(
  vcHash: string,
  subjectAddress: string,
  expiry: number,
) {
  let contract;
  try {
    contract = await getVcRegistryContract();
  } catch (error) {
    console.error(
      "Error creating VC registry transaction:",
      (error as Error).message,
    );
    throw new Error(
      "[createVcRegistryTx] Error getting VC registry contract: " +
        (error as Error).message,
    );
  }

  const subjectAddressParts = subjectAddress.split(":");
  if (subjectAddressParts.length !== 5) {
    throw new Error(
      "Invalid subject DID format. Expected format: did:ethr:polygon:amoy:<wallet_address>",
    );
  }
  const subjectWalletAddress = subjectAddressParts[4];

  let tx;
  try {
    console.log(vcHash, subjectWalletAddress, expiry);
    tx = await contract.registerCredential(
      vcHash as string, // Pass vcHash as a string directly
      subjectWalletAddress,
      expiry,
    );
  } catch (error) {
    console.error("Error registering VC:", (error as Error).message);
    throw new Error(
      "[createVcRegistryTx] Error registering VC: " + (error as Error).message,
    );
  }
  const receipt = await tx.wait();

  return receipt.hash;
}

/**
 * Revokes a credential hash from chain so escrow-critical actions can be blocked.
 * @param vcHash hash string of VC (the unhashed SHA-256 string used during registerCredential)
 * @returns blockchain transaction hash
 */
export async function revokeVcRegistryTx(vcHash: string) {
  let contract;
  try {
    contract = await getVcRegistryContract();
  } catch (error) {
    throw new Error(
      "[revokeVcRegistryTx] Error getting VC registry contract: " +
        (error as Error).message,
    );
  }

  let tx;
  try {
    tx = await contract.revokeCredential(vcHash);
  } catch (error) {
    throw new Error(
      "[revokeVcRegistryTx] Error revoking VC: " + (error as Error).message,
    );
  }

  const receipt = await tx.wait();
  return receipt.hash;
}
