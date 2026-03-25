import jwt from "jsonwebtoken";
import { keccak256, toUtf8Bytes } from "ethers";
import { IssueVCParams, VCResult } from "../../type/vc.types";
import { buildVcRegistrationAuthorisation } from "../blockchain/blockchain.service";
import { getIssuerAuthorisationSigner } from "../../lib/ether";

const VC_TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year

export async function issueVC(params: IssueVCParams): Promise<VCResult> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + VC_TTL_SECONDS;

    const issuerDid = `did:ethr:polygon:amoy:${
      getIssuerAuthorisationSigner().address
    }`;

    const vcPayload = {
      iss: issuerDid,
      sub: params.subjectDid,
      iat: now,
      exp,
      vc: {
        type: ["VerifiableCredential", "KYCVerification"],
        credentialSubject: params.kycData,
      },
    };

    // Sign VC as JWT
    const privateKeyBase64 = process.env.VC_SIGNING_PRIVATE_KEY!;
    const privateKeyPEM = Buffer.from(privateKeyBase64, "base64").toString(
      "utf-8",
    );

    const signedVC = jwt.sign(vcPayload, privateKeyPEM, {
      algorithm: "ES256",
    });

    // Hash VC for on-chain anchoring (bytes32, Ethereum keccak256)
    const vcHash = keccak256(toUtf8Bytes(signedVC));

    // Build issuer authorisation for subject-submitted on-chain registration
    const registrationAuthorisation = await buildVcRegistrationAuthorisation(
      vcHash,
      params.subjectDid,
      exp,
    );

    return {
      vc: signedVC,
      vcHash,
      registrationAuthorisation,
      issuedAt: new Date(now * 1000).toISOString(),
      expiresAt: new Date(exp * 1000).toISOString(),
      issuerDid: issuerDid,
      success: true,
    };
  } catch (error) {
    return {
      vc: "",
      vcHash: "",
      registrationAuthorisation: null,
      issuedAt: "",
      expiresAt: "",
      issuerDid: "",
      success: false,
      errorMsg: "Error issuing VC: " + (error as Error).message,
    };
  }
}
