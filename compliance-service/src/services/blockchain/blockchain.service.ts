import { getContract } from "../../lib/ether";

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
  const contract = await getContract();

  const tx = await contract.registerCredential(vcHash, subjectAddress, expiry);

  const receipt = await tx.wait();

  return receipt.hash;
}
