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
import {
  ExecutionResult,
  JobListingsResult,
  SmartAccountTransactionResult,
} from "@/types";
import { redirect } from "next/navigation";
import {
  ESCROW_CONTRACT_ADDRESS,
  getContract,
  getProvider,
  parseSGDToPolygon,
} from "./ether";
import { sendSmartAccountTransaction, getWalletAddress } from "./aaActions";

/**
 * Helper function to validate job existence and status
 * @param jobId - unique ID of job
 * @param expectedStatus - expected job status or array of statuses
 * @param employerId - (optional) employer ID to validate ownership
 * @returns { success: boolean; errorMsg?: string }
 */
async function validateJobDetails(
  jobId: number,
  expectedStatus: JobStatus | JobStatus[],
  employerId?: number
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
        " or "
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

/**
 * Shared helper to execute job-related blockchain transactions
 * Handles job validation, contract encoding, transaction execution, and DB updates
 */
async function executeJobTransaction(params: {
  userId: number;
  functionName: string;
  functionArgs: (string | number | bigint | boolean)[]; // `any` is not allowed
  amount?: bigint;
  onSuccess: (txHash: string) => Promise<void>;
}): Promise<SmartAccountTransactionResult> {
  const { userId, functionName, functionArgs, amount, onSuccess } = params;
  const fallbackErrorHash = "" as `0x${string}`;

  // 1. Encode contract function call
  const contract = await getContract(getProvider());
  const callData = contract.interface.encodeFunctionData(
    functionName,
    functionArgs
  );

  // 2. Send transaction via smart account
  let txHashResult: string, userOpHashResult: string;
  try {
    const { txHash, userOpHash, success, errorMsg } =
      await sendSmartAccountTransaction(
        userId,
        ESCROW_CONTRACT_ADDRESS,
        callData,
        amount
      );
    if (!success) {
      throw new Error("Smart account transaction failed: " + errorMsg);
    }
    txHashResult = txHash;
    userOpHashResult = userOpHash;
  } catch (error) {
    console.error(`Error executing ${functionName}:`, error);
    return {
      success: false,
      errorMsg: `Error executing ${functionName}: ${(error as Error).message}`,
      txHash: fallbackErrorHash,
      userOpHash: fallbackErrorHash,
    };
  }

  // 3. Update DB with transaction result
  try {
    await onSuccess(txHashResult);
  } catch (error) {
    console.error(`Error updating DB after ${functionName}:`, error);
    return {
      success: false,
      errorMsg: `Error updating DB after ${functionName}: ${
        (error as Error).message
      }`,
      txHash: fallbackErrorHash,
      userOpHash: fallbackErrorHash,
    };
  }

  return {
    success: true,
    txHash: txHashResult as `0x${string}`,
    userOpHash: userOpHashResult as `0x${string}`,
  };
}

/**
 * Create a job as an employer
 * @param prevState - TODO
 * @param formData - job details
 * @returns
 */
export async function postingJobAction(
  prevState: string | undefined,
  formData: FormData
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
  pageSize: number
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
    JobStatus.POSTED
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

export async function acceptJobAction(params: {
  jobId: number;
  workerId: number;
}) {
  const { jobId, workerId } = params;

  const { success, errorMsg } = await validateJobDetails(
    jobId,
    JobStatus.FUNDED
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

export async function applyFundReleaseAction(params: {
  jobId: number;
  workerId: number;
}): Promise<SmartAccountTransactionResult> {
  const { jobId, workerId } = params;

  const { success, errorMsg } = await validateJobDetails(
    jobId,
    JobStatus.IN_PROGRESS
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

export async function acceptFundReleaseAction(params: {
  jobId: number;
  employerId: number;
}): Promise<SmartAccountTransactionResult> {
  const { jobId, employerId } = params;

  const { success, errorMsg } = await validateJobDetails(
    jobId,
    JobStatus.PENDING_APPROVAL
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

export async function deleteJobAction(params: {
  jobId: number;
  employerId: number;
}) {
  const { jobId, employerId } = params;

  const { success, errorMsg } = await validateJobDetails(
    jobId,
    [JobStatus.POSTED, JobStatus.COMPLETED],
    employerId
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

export async function refundPaymentAction(params: {
  jobId: number;
  employerId: number;
}): Promise<SmartAccountTransactionResult> {
  const { jobId, employerId } = params;

  const { success, errorMsg } = await validateJobDetails(
    jobId,
    [JobStatus.FUNDED, JobStatus.IN_PROGRESS],
    employerId
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
