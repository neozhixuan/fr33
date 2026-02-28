"use server";

import { Job, JobStatus } from "@/generated/prisma-client";
import {
  createJobListing,
  getJobDetails,
  getJobListings,
  updateJobAfterFunding,
  updateJobAfterAcceptJob,
  updateJobAfterApplyFundRelease,
  updateJobAfterAcceptFundRelease,
  deleteJobListing,
  updateJobAfterRefundPayment,
} from "@/model/job";
import { JobListingsResult, SmartAccountTransactionResult } from "@/types";
import { parseSGDToPolygon } from "./ether";
import { getWalletAddress } from "./aaActions";

import { executeJobTransaction } from "@/utils/aaUtils";
import { validateJobDetails } from "@/utils/jobUtils";

import { redirect } from "next/navigation";

/**
 * Create a job as an employer
 * @param prevState - TODO
 * @param formData - job details
 * @returns
 */
export async function postingJobAction(
  prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  try {
    const title = formData.get("title")?.toString() || "";
    const description = formData.get("description")?.toString() || "";
    const payment = formData.get("payment")?.toString() || "";

    // Hidden input field, no need to verify
    const employerId = parseInt(formData.get("employerId")?.toString() || "0");

    if (!title || !description || !payment) {
      return "Error: Please fill in all fields.";
    }

    await createJobListing(title, description, parseFloat(payment), employerId);

    redirect("/job-portal");
  } catch (error) {
    throw error;
  }
}

/**
 * Get the list of jobs with pagination
 * @returns
 */
export async function getJobListingsAction(
  page: number,
  pageSize: number,
): Promise<JobListingsResult> {
  return getJobListings(page, pageSize);
}

/**
 * Get the details of a singular job
 * @returns Promise<Job | null>
 */
export async function getJobDetailsAction(jobId: number): Promise<Job | null> {
  return getJobDetails(jobId);
}

/**
 * Funds a specific escrow for a job
 * @param params - { jobId: number; employerId: number }
 * @returns
 */
export async function fundEscrowAction(params: {
  jobId: number;
  employerId: number;
}): Promise<SmartAccountTransactionResult> {
  const { jobId, employerId } = params;
  const job = await getJobDetails(jobId);
  if (!job) throw new Error("Job not found");

  const amountInWei = parseSGDToPolygon(job.amount.toString());

  const { success, errorMsg } = await validateJobDetails(
    jobId,
    JobStatus.POSTED,
  );
  if (!success) {
    return {
      success: false,
      errorMsg,
      txHash: "" as `0x${string}`,
      userOpHash: "" as `0x${string}`,
    };
  }

  return executeJobTransaction({
    userId: employerId,
    functionName: "fundJob",
    functionArgs: [jobId],
    amount: amountInWei,
    onSuccess: (txHash) => updateJobAfterFunding(jobId, txHash),
  });
}

/**
 * A worker accepts a particular job through this action.
 * @param params - { jobId: number; workerId: number }
 * @returns
 */
export async function acceptJobAction(params: {
  jobId: number;
  workerId: number;
}) {
  const { jobId, workerId } = params;

  const { success, errorMsg } = await validateJobDetails(
    jobId,
    JobStatus.FUNDED,
  );
  if (!success) {
    return {
      success: false,
      errorMsg,
      txHash: "" as `0x${string}`,
      userOpHash: "" as `0x${string}`,
    };
  }

  return executeJobTransaction({
    userId: workerId,
    functionName: "acceptJob",
    functionArgs: [jobId],
    onSuccess: async (txHash) => {
      const workerWalletAddress = await getWalletAddress(workerId);
      return updateJobAfterAcceptJob(jobId, workerWalletAddress, txHash);
    },
  });
}

/**
 * A worker applies for fund release after completing the job.
 * @param params - { jobId: number; workerId: number }
 * @returns
 */
export async function applyFundReleaseAction(params: {
  jobId: number;
  workerId: number;
}): Promise<SmartAccountTransactionResult> {
  const { jobId, workerId } = params;

  const { success, errorMsg } = await validateJobDetails(
    jobId,
    JobStatus.IN_PROGRESS,
  );
  if (!success) {
    return {
      success: false,
      errorMsg,
      txHash: "" as `0x${string}`,
      userOpHash: "" as `0x${string}`,
    };
  }

  return executeJobTransaction({
    userId: workerId,
    functionName: "requestRelease",
    functionArgs: [jobId],
    onSuccess: (txHash) => updateJobAfterApplyFundRelease(jobId, txHash),
  });
}

/**
 * An employer accepts the fund release request from a worker.
 * @param params - { jobId: number; employerId: number }
 * @returns
 */
export async function acceptFundReleaseAction(params: {
  jobId: number;
  employerId: number;
}): Promise<SmartAccountTransactionResult> {
  const { jobId, employerId } = params;

  const { success, errorMsg } = await validateJobDetails(
    jobId,
    JobStatus.PENDING_APPROVAL,
  );
  if (!success) {
    return {
      success: false,
      errorMsg,
      txHash: "" as `0x${string}`,
      userOpHash: "" as `0x${string}`,
    };
  }

  return executeJobTransaction({
    userId: employerId,
    functionName: "approveRelease",
    functionArgs: [jobId],
    onSuccess: (txHash) => updateJobAfterAcceptFundRelease(jobId, txHash),
  });
}

/**
 * The employer who created the job deletes the listing, if it is not in progress, or already completed.
 * @param params - { jobId: number; employerId: number }
 * @returns
 */
export async function deleteJobAction(params: {
  jobId: number;
  employerId: number;
}) {
  const { jobId, employerId } = params;

  const { success, errorMsg } = await validateJobDetails(
    jobId,
    [JobStatus.POSTED, JobStatus.COMPLETED],
    employerId,
  );
  if (!success) {
    return {
      success: false,
      errorMsg,
      txHash: "" as `0x${string}`,
      userOpHash: "" as `0x${string}`,
    };
  }

  // Delete job from DB
  try {
    await deleteJobListing(jobId);
  } catch (error) {
    console.error("Error deleting job listing:", error);
    return {
      success: false,
      errorMsg: "Error deleting job listing: " + (error as Error).message,
      txHash: "" as `0x${string}`,
      userOpHash: "" as `0x${string}`,
    };
  }

  // TODO: delete evidence also

  return {
    success: true,
    errorMsg: "",
  };
}

/**
 * The employer refunds the payment for a job that is funded, but not in progress.
 * @param params - { jobId: number; employerId: number }
 * @returns
 */
export async function refundPaymentAction(params: {
  jobId: number;
  employerId: number;
}): Promise<SmartAccountTransactionResult> {
  const { jobId, employerId } = params;

  const { success, errorMsg } = await validateJobDetails(
    jobId,
    [JobStatus.FUNDED, JobStatus.IN_PROGRESS],
    employerId,
  );
  if (!success) {
    return {
      success: false,
      errorMsg,
      txHash: "" as `0x${string}`,
      userOpHash: "" as `0x${string}`,
    };
  }

  return executeJobTransaction({
    userId: employerId,
    functionName: "cancelJob",
    functionArgs: [jobId],
    onSuccess: () => updateJobAfterRefundPayment(jobId),
  });
}
