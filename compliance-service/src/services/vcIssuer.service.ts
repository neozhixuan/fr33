import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../db/prisma";

const ISSUER_DID = "did:web:compliance.fr33.sg";
const VC_TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year

type VCResult = {
  vc: string;
  vcHash: string;
  issuedAt: string;
  expiresAt: string;
  issuerDid: string;
  success: boolean;
  errorMsg?: string;
};

type IssueVCParams = {
  subjectDid: string;
  kycData: {
    uinHash: string;
    nameHash: string;
    birthdate: string;
    ageOver: boolean;
    country: string;
    verifiedAt: string;
  };
};

export async function issueVC(params: IssueVCParams): Promise<VCResult> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + VC_TTL_SECONDS;

    const vcPayload = {
      iss: ISSUER_DID,
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
      "utf-8"
    );

    const signedVC = jwt.sign(vcPayload, privateKeyPEM, {
      algorithm: "ES256",
    });

    // Hash VC for reference
    const vcHash = crypto.createHash("sha256").update(signedVC).digest("hex");

    // Store metadata only
    await prisma.issuedVC.create({
      data: {
        vcHash,
        subjectDid: params.subjectDid,
        issuedAt: new Date(now * 1000),
        expiresAt: new Date(exp * 1000),
        status: "VALID",
      },
    });

    return {
      vc: signedVC,
      vcHash,
      issuedAt: new Date(now * 1000).toISOString(),
      expiresAt: new Date(exp * 1000).toISOString(),
      issuerDid: ISSUER_DID,
      success: true,
    };
  } catch (error) {
    return {
      vc: "",
      vcHash: "",
      issuedAt: "",
      expiresAt: "",
      issuerDid: "",
      success: false,
      errorMsg: "Error issuing VC: " + (error as Error).message,
    };
  }
}
