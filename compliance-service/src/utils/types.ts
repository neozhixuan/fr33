export type VCRegistrationAuthorisation = {
  vcHash: string;
  subjectAddress: string;
  expiresAt: string;
  nonce: string;
  deadline: string;
  signature: string;
};

export type VCResult = {
  vc: string;
  vcHash: string;
  registrationAuthorisation: VCRegistrationAuthorisation | null;
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
