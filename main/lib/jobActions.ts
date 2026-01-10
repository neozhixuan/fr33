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
} from "@/model/job";
import { JobListingsResult, SmartAccountTransactionResult } from "@/types";
import { redirect } from "next/navigation";
import {
  ESCROW_CONTRACT_ADDRESS,
  getContract,
  getProvider,
  parseSGDToPolygon,
} from "./ether";
import { sendSmartAccountTransaction, getWalletAddress } from "./aaActions";

/**
 * Shared helper to execute job-related blockchain transactions
 * Handles job validation, contract encoding, transaction execution, and DB updates
 */
async function executeJobTransaction(params: {
  jobId: number;
  userId: number;
  functionName: string;
  functionArgs: (string | number | bigint | boolean)[]; // `any` is not allowed
  expectedStatus: JobStatus | JobStatus[];
  amount?: bigint;
  onSuccess: (txHash: string) => Promise<void>;
}): Promise<SmartAccountTransactionResult> {
  const {
    jobId,
    userId,
    functionName,
    functionArgs,
    expectedStatus,
    amount,
    onSuccess,
  } = params;
  const fallbackErrorHash = "" as `0x${string}`;

  // 1. Get job from DB and validate status
  const job = await getJobDetails(jobId);
  if (!job) throw new Error("Job not found");

  const expectedStatuses = Array.isArray(expectedStatus)
    ? expectedStatus
    : [expectedStatus];
  if (!expectedStatuses.includes(job.status as JobStatus)) {
    throw new Error(
      `Job status must be one of: ${expectedStatuses.join(", ")}`
    );
  }

  // 2. Encode contract function call
  const contract = await getContract(getProvider());
  const callData = contract.interface.encodeFunctionData(
    functionName,
    functionArgs
  );

  // 3. Send transaction via smart account
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

  // 4. Update DB with transaction result
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

  return executeJobTransaction({
    jobId,
    userId: employerId,
    functionName: "fundJob",
    functionArgs: [jobId],
    expectedStatus: "POSTED",
    amount: amountInWei,
    onSuccess: (txHash) => updateJobAfterFunding(jobId, txHash),
  });
}

export async function acceptJobAction(params: {
  jobId: number;
  workerId: number;
}) {
  const { jobId, workerId } = params;

  return executeJobTransaction({
    jobId,
    userId: workerId,
    functionName: "acceptJob",
    functionArgs: [jobId],
    expectedStatus: "FUNDED",
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

  return executeJobTransaction({
    jobId,
    userId: workerId,
    functionName: "requestRelease",
    functionArgs: [jobId],
    expectedStatus: JobStatus.IN_PROGRESS,
    onSuccess: (txHash) => updateJobAfterApplyFundRelease(jobId, txHash),
  });
}

export async function acceptFundReleaseAction(params: {
  jobId: number;
  employerId: number;
}): Promise<SmartAccountTransactionResult> {
  const { jobId, employerId } = params;

  return executeJobTransaction({
    jobId,
    userId: employerId,
    functionName: "approveRelease",
    functionArgs: [jobId],
    expectedStatus: JobStatus.PENDING_APPROVAL,
    onSuccess: (txHash) => updateJobAfterAcceptFundRelease(jobId, txHash),
  });
}
