import { DisputeOutcome } from "@/type/disputeTypes";

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

export const DISPUTE_OUTCOME_TO_CONTRACT_ENUM: Record<DisputeOutcome, number> =
  {
    RELEASE_TO_WORKER: 0,
    RETURN_TO_EMPLOYER: 1,
    SPLIT: 2,
  };

/**
 * Fetches the fund release timeout duration from environment variables, with default value of 48 hours.
 * This is the time period after a worker requests fund release during which the employer can approve or reject the request
 * before it can be automatically released to the worker.
 * @returns The fund release timeout in seconds, guaranteed to be a positive integer. Throws an error if the environment variable is set to an invalid value.
 */
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

/**
 * Fetches the polling interval for the timeout release worker from environment variables, with default value of 60 seconds.
 * @returns The polling interval in milliseconds, guaranteed to be an integer greater than or equal to 5000. Throws an error if the environment variable is set to an invalid value.
 */
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

/**
 * Checks if the timeout release worker is enabled based on environment variables.
 * This worker is responsible for automatically releasing funds to workers if employers fail to respond within the timeout period after a release request.
 * @returns A boolean indicating whether the timeout release worker is enabled.
 */
export function isTimeoutWorkerEnabled(): boolean {
  return process.env.NEXT_TIMEOUT_RELEASE_WORKER_ENABLED === "true";
}

/**
 * Extracts the user ID from the session, ensuring it's a valid integer
 * @param session - The session object which may contain user information
 * @return The user ID as a number if valid, otherwise throws an error indicating unauthorized access
 */
export function getSessionUserId(
  session: { user?: { id?: string | null } } | null,
): number {
  const raw = session?.user?.id;
  const parsed = Number(raw);
  if (!raw || !Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Unauthorized");
  }
  return parsed;
}
