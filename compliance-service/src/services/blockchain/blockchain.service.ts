import { getVcRegistryContract } from "../../lib/ether";

function normaliseVcHash(vcHash: string): `0x${string}` {
  const trimmed = vcHash.trim();

  if (/^0x[0-9a-fA-F]{64}$/.test(trimmed)) {
    return trimmed as `0x${string}`;
  }

  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return `0x${trimmed}` as `0x${string}`;
  }

  throw new Error("Invalid VC hash format. Expected a 32-byte hex string");
}

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
  const vcHashBytes32 = normaliseVcHash(vcHash);

  let tx;
  try {
    console.log(vcHashBytes32, subjectWalletAddress, expiry);
    tx = await contract.registerCredential(
      vcHashBytes32,
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
