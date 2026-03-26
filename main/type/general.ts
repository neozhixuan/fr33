import { Job, Wallet } from "@/generated/prisma-client";

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
export type VCRegistrationAuthorisation = {
  vcHash: string;
  subjectAddress: string;
  expiresAt: string;
  nonce: string;
  deadline: string;
  signature: string;
};

export type VCData = {
  vc: string;
  vcHash: string;
  issuedAt: string;
  expiresAt: string;
  issuerDid: string;
  registrationAuthorisation: VCRegistrationAuthorisation | null;
};

export type IssueVCResponse = VCData & ExecutionResult;

// Smart Account Details
export type SmartAccountDetails = Pick<Wallet, "address">;

export type PreparedSmartAccountTransaction = {
  target: `0x${string}`;
  data: `0x${string}`;
  value: string; // wei (base-10 string)
  summary: string;
};

export type PreparedSmartAccountTransactionResult = ExecutionResult & {
  txRequest?: PreparedSmartAccountTransaction;
};

export type SmartAccountTransactionResult = {
  txHash: `0x${string}`;
  userOpHash: `0x${string}`;
} & ExecutionResult;

// Misc
export type ExecutionResult = {
  success: boolean;
  errorMsg?: string;
};

// Job
export type JobListItem = Omit<Job, "amount"> & { amount: number };

export type JobListingsResult = {
  items: JobListItem[];
  total: number;
  totalPages: number;
};

export type JobForClientType = Omit<Job, "amount"> & { amount: number };

export type ReleaseEvidenceItem = {
  id: number;
  jobId: number;
  type: string;
  fileUrl: string;
  notes: string | null;
  uploadedAt: string;
  uploadedBy: number;
};
