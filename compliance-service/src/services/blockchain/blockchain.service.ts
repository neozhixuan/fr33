import {
  getIssuerAuthorisationSigner,
  getProvider,
  getVcRegistryReadContract,
} from "../../lib/ether";
import { VCRegistrationAuthorisation } from "../../utils/types";

const ISSUER_AUTHORISATION_VALIDITY_SECONDS = 15 * 60; // 15 minutes

function didToAddress(subjectDid: string): string {
  const subjectAddressParts = subjectDid.split(":");
  if (subjectAddressParts.length !== 5) {
    throw new Error(
      "Invalid subject DID format. Expected format: did:ethr:polygon:amoy:<wallet_address>",
    );
  }

  return subjectAddressParts[4];
}

function normaliseVcHash(vcHash: string): `0x${string}` {
  const hex = vcHash.startsWith("0x") ? vcHash.slice(2) : vcHash;
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("Invalid VC hash. Expected 32-byte hex string");
  }

  return `0x${hex.toLowerCase()}`;
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
