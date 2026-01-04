// KYC Data
export type KycDataDTO = {
  fullName: string;
  kycVerified: boolean;
  idType: string;
  idNumber: string;
  dob: string;
  kycTimestamp: string;
};

// VC Data
export type VCData = {
  vc: string;
  vcHash: string;
  issuedAt: string;
  expiresAt: string;
  issuerDid: string;
};

export type IssueVCResponse = VCData & ExecutionResult;

// Smart Account Details
export type SmartAccountDetails = {
  smartAccountAddress: string;
  encryptedWithIv: string;
};

// Misc
export type ExecutionResult = {
  success: boolean;
  errorMsg?: string;
};
