import { JobStatus, UserRole } from "@/generated/prisma-client";

export type DbDispute = {
  id: number;
  jobId: number;
  openedByUserId: number;
  status: DisputeStatus;
  freezeTxHash: string | null;
  resolutionTxHash: string | null;
  decision: DisputeOutcome | null;
  workerShareBps: number | null;
  decisionReason: string | null;
  adminReviewNote: string | null;
  decidedByAdminId: number | null;
  openedAt: Date;
  decidedAt: Date | null;
  resolvedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DbDisputeEvidence = {
  id: number;
  disputeId: number;
  submittedByUserId: number;
  submittedByRole: UserRole;
  evidenceType: DisputeEvidenceType;
  contentText: string;
  attachmentUrl: string | null;
  externalRef: string | null;
  idempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DisputeWithRelations = DbDispute & {
  job: {
    id: number;
    employerId: number;
    workerWallet: string | null;
    title: string;
    status: JobStatus;
    applyReleaseAt: Date | null;
  };
  openedBy: { id: number; email: string; role: UserRole };
  decidedBy: { id: number; email: string; role: UserRole } | null;
  evidences: DbDisputeEvidence[];
};

export type UserDisputeContext = {
  id: number;
  role: UserRole;
  walletAddress: string | null;
};

export type DisputeStatus =
  | "OPEN"
  | "EVIDENCE_SUBMISSION"
  | "UNDER_REVIEW"
  | "DECIDED"
  | "ONCHAIN_PENDING"
  | "RESOLVED"
  | "CANCELLED";

export type DisputeOutcome =
  | "RELEASE_TO_WORKER"
  | "RETURN_TO_EMPLOYER"
  | "SPLIT";

export type DisputeEvidenceType =
  | "STATEMENT"
  | "DELIVERY_PROOF"
  | "COMMUNICATION_LOG"
  | "SCREENSHOT"
  | "INVOICE"
  | "OTHER";
