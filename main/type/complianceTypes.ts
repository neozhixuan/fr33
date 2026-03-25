// Type definitions based on compliance service schema
export type EscrowEventTypes =
  | "JOB_CREATED"
  | "JOB_ACCEPTED"
  | "RELEASE_REQUESTED"
  | "FUNDS_RELEASED"
  | "JOB_CANCELLED";

export interface ComplianceProfile {
  id: number;
  walletAddress: string;
  cumulativeScore: number;
  lastTriggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceRuleTrigger {
  id: number;
  profileId: number;
  ruleName: string;
  scoreDelta: number;
  threshold: Record<string, unknown>;
  observed: Record<string, unknown>;
  sourceEventId?: string;
  sourceTxHash?: string;
  triggeredAt: string;
}

export interface ComplianceCase {
  id: number;
  profileId: number;
  profile?: ComplianceProfile;
  status: "OPEN" | "DISMISSED" | "ACTIONED";
  scoreAtCreation: number;
  triggeredRules: string[];
  evidence: Record<string, unknown>;
  actionNotes?: string | null;
  actionTxHash?: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  ruleTriggers?: ComplianceRuleTrigger[];
  account?: {
    walletId: number;
    address: string;
    did: string;
    walletStatus: string;
    walletCreatedAt: string;
    user: {
      id: number;
      email: string;
      role: string;
      onboardingStage: string;
      createdAt: string;
    };
    vcMetadata: {
      vcHash: string;
      status: string;
      issuedAt: string;
      expiresAt: string;
      revokedAt: string | null;
    } | null;
  } | null;
}

export interface ListCasesResponse {
  cases: ComplianceCase[];
  total?: number;
}

export interface VCInventoryItem {
  walletId: number;
  walletAddress: string;
  walletDid: string;
  userId: number;
  userEmail: string;
  userRole: string;
  vcHash: string;
  status: string;
  issuedAt: string;
  expiresAt: string;
  revokedAt: string | null;
}

export interface VCInventoryPage {
  rows: VCInventoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MainServiceAuditLog {
  id: number;
  userId?: number | null;
  userEmail?: string | null;
  action: string;
  result: "ALLOWED" | "BLOCKED";
  walletAddress?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface MonitoringLog {
  id: number;
  sourceEventId: string;
  jobId: string;
  eventType:
    | "JOB_CREATED"
    | "JOB_ACCEPTED"
    | "RELEASE_REQUESTED"
    | "FUNDS_RELEASED"
    | "JOB_CANCELLED";
  walletAddress: string | null;
  counterpartyAddress: string | null;
  amountWei: string | null;
  blockNumber: string;
  blockTimestamp: string;
  txHash: string;
  logIndex: number;
  createdAt: string;
}
