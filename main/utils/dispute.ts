export const ACTIVE_DISPUTE_STATUSES = [
  "OPEN",
  "EVIDENCE_SUBMISSION",
  "UNDER_REVIEW",
  "DECIDED",
  "ONCHAIN_PENDING",
] as const;

export const EVIDENCE_ALLOWED_STATUSES = [
  "OPEN",
  "EVIDENCE_SUBMISSION",
  "UNDER_REVIEW",
] as const;

export const ADMIN_REVIEWABLE_STATUSES = [
  "OPEN",
  "EVIDENCE_SUBMISSION",
  "UNDER_REVIEW",
] as const;

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

export const DISPUTE_OUTCOME_TO_CONTRACT_ENUM: Record<DisputeOutcome, number> =
  {
    RELEASE_TO_WORKER: 0,
    RETURN_TO_EMPLOYER: 1,
    SPLIT: 2,
  };

export function getFundReleaseTimeoutSeconds(): number {
  const raw = process.env.NEXT_FUND_RELEASE_TIMEOUT_SECONDS || "172800"; // 48h
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(
      `Invalid NEXT_FUND_RELEASE_TIMEOUT_SECONDS value: ${raw}. It must be a positive number.`,
    );
  }
  return Math.floor(parsed);
}

export function getTimeoutReleasePollMs(): number {
  const raw = process.env.NEXT_TIMEOUT_RELEASE_POLL_MS || "60000";
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 5000) {
    throw new Error(
      `Invalid NEXT_TIMEOUT_RELEASE_POLL_MS value: ${raw}. It must be >= 5000.`,
    );
  }
  return Math.floor(parsed);
}

export function isTimeoutWorkerEnabled(): boolean {
  return process.env.NEXT_TIMEOUT_RELEASE_WORKER_ENABLED === "true";
}
