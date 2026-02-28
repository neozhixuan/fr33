import { ExecutionResult } from "@/types";
import { JobStatus } from "@/generated/prisma-client";
import { getJobDetails } from "@/model/job";

/**
 * Helper function to validate job existence and status
 * @param jobId - unique ID of job
 * @param expectedStatus - expected job status or array of statuses
 * @param employerId - (optional) employer ID to validate ownership
 * @returns { success: boolean; errorMsg?: string }
 */
export async function validateJobDetails(
  jobId: number,
  expectedStatus: JobStatus | JobStatus[],
  employerId?: number,
): Promise<ExecutionResult> {
  // 1. Get job from DB and validate status
  const job = await getJobDetails(jobId);
  if (!job)
    return {
      success: false,
      errorMsg: "Job not found",
    };

  const expectedStatuses = Array.isArray(expectedStatus)
    ? expectedStatus
    : [expectedStatus];
  if (!expectedStatuses.includes(job.status as JobStatus)) {
    return {
      success: false,
      errorMsg: `Invalid job status. Expected: ${expectedStatuses.join(
        " or ",
      )}, Found: ${job.status}`,
    };
  }

  // Conditional validation (if employerId is provided)
  if (employerId && job.employerId !== employerId) {
    return {
      success: false,
      errorMsg: "Unauthorized: You are not the employer of this job",
    };
  }

  return { success: true };
}
