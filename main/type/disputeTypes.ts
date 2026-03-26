import { JobStatus, UserRole } from "@/generated/prisma-client";

// Frontend

type DisputeEvidence = {
  id: number;
  submittedByRole: string;
  evidenceType: string;
  contentText: string;
  createdAt: string;
};

type ReleaseEvidence = {
  id: number;
  type: string;
  fileUrl: string;
  notes: string | null;
  uploadedAt: string;
  uploadedBy: number;
};

export type DisputeDetailData = {
  id: number;
  jobId: number;
  status: string;
  freezeTxHash: string | null;
  resolutionTxHash: string | null;
  decision: string | null;
  decisionReason: string | null;
  workerShareBps: number | null;
  openedAt: string;
  updatedAt: string;
  job: {
    id: number;
    title: string;
    employerId: number;
    workerWallet: string | null;
    status: string;
    fundedTxHash: string | null;
    acceptTxHash: string | null;
    applyReleaseTxHash: string | null;
    approveReleaseTxHash: string | null;
    releaseEvidences: ReleaseEvidence[];
  };
  evidences: DisputeEvidence[];
};

export type DisputeDetailProps = {
  disputeId: number;
  role: UserRole;
};

export type DisputeSummary = {
  id: number;
  jobId: number;
  status: string;
  openedByUserId: number;
  openedAt: string;
  createdAt: string;
  updatedAt: string;
  decisionReason: string | null;
};

// Backend
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
    fundedTxHash: string | null;
    acceptTxHash: string | null;
    applyReleaseTxHash: string | null;
    approveReleaseTxHash: string | null;
    releaseEvidences: {
      id: number;
      type: string;
      fileUrl: string;
      notes: string | null;
      uploadedAt: Date;
      uploadedBy: number;
    }[];
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
