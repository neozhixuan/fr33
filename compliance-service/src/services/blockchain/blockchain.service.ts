import {
  getIssuerAuthorisationSigner,
  getProvider,
  getVcRegistryReadContract,
  getVcRegistryWriteContract,
} from "../../lib/ether";
import { VCRegistrationAuthorisation } from "../../utils/types";

const ISSUER_AUTHORISATION_VALIDITY_SECONDS = 15 * 60; // 15 minutes

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

function didToAddress(subjectDid: string): string {
  const subjectAddressParts = subjectDid.split(":");
  if (subjectAddressParts.length !== 5) {
    throw new Error(
      "Invalid subject DID format. Expected format: did:ethr:polygon:amoy:<wallet_address>",
    );
  }

  return subjectAddressParts[4];
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
  const normalisedHash = normaliseVcHash(vcHash);
  const contract = await getVcRegistryWriteContract();

  try {
    const tx = await contract.registerCredential(
      normalisedHash,
      subjectAddress,
      expiry,
    );
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    throw new Error(
      "[createVcRegistryTx] Error registering VC: " + (error as Error).message,
    );
  }
}

/**
 * Builds an issuer authorisation signature for user-submitted VC registration.
 */
export async function buildVcRegistrationAuthorisation(
  vcHash: string,
  subjectDid: string,
  expiresAt: number,
): Promise<VCRegistrationAuthorisation> {
  const subjectAddress = didToAddress(subjectDid);
  const normalisedHash = normaliseVcHash(vcHash);

  const contract = await getVcRegistryReadContract();
  const contractAddress = await contract.getAddress();

  const nonce: bigint = await contract.nonces(subjectAddress);
  const now = Math.floor(Date.now() / 1000);
  const deadline = now + ISSUER_AUTHORISATION_VALIDITY_SECONDS;

  const network = await getProvider().getNetwork();
  const chainId = Number(network.chainId);

  const signer = getIssuerAuthorisationSigner();

  const signature = await signer.signTypedData(
    {
      name: "VCRegistry",
      version: "1",
      chainId,
      verifyingContract: contractAddress,
    },
    {
      RegisterCredential: [
        { name: "vcHash", type: "bytes32" },
        { name: "subject", type: "address" },
        { name: "expiresAt", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    {
      vcHash: normalisedHash,
      subject: subjectAddress,
      expiresAt: BigInt(expiresAt),
      nonce,
      deadline: BigInt(deadline),
    },
  );

  return {
    vcHash: normalisedHash,
    subjectAddress,
    expiresAt: expiresAt.toString(),
    nonce: nonce.toString(),
    deadline: deadline.toString(),
    signature,
  };
}

/**
 * Revokes a credential hash from chain so escrow-critical actions can be blocked.
 * @param vcHash hash string of VC (the unhashed SHA-256 string used during registerCredential)
 * @returns blockchain transaction hash
 */
export async function revokeVcRegistryTx(vcHash: string) {
  const contract = await getVcRegistryWriteContract();

  try {
    const trimmed = vcHash.trim();
    const tx = /^0x[0-9a-fA-F]{64}$/.test(trimmed)
      ? await contract.revokeCredentialHash(trimmed)
      : await contract.revokeCredential(trimmed);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    throw new Error(
      "[revokeVcRegistryTx] Error revoking VC: " + (error as Error).message,
    );
  }
}
