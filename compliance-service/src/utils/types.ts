export type VCResult = {
  vc: string;
  vcHash: string;
  txHash: string;
  issuedAt: string;
  expiresAt: string;
  issuerDid: string;
  success: boolean;
  errorMsg?: string;
};

export type IssueVCParams = {
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
