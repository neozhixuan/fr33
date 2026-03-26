"use server";

import { Job, JobStatus, UserRole } from "@/generated/prisma-client";
import {
  createJobListing,
  getJobDetails,
  getReleaseEvidencesByJobId,
  getJobListings,
  updateJobAfterFunding,
  updateJobAfterAcceptJob,
  updateJobAfterApplyFundRelease,
  updateJobAfterAcceptFundRelease,
  deleteJobListing,
  updateJobAfterRefundPayment,
} from "@/model/job";
import {
  JobListingsResult,
  PreparedSmartAccountTransactionResult,
  ReleaseEvidenceItem,
  SmartAccountTransactionResult,
} from "@/type/general";
import { parseSGDToPolygon } from "./ether";
import { getWalletAddress } from "./aaActions";

import { buildEscrowTransactionRequest } from "@/utils/aaUtils";
import { validateJobDetails } from "@/utils/jobUtils";

import { redirect } from "next/navigation";

const MAX_RELEASE_EVIDENCE_TEXT_LENGTH = 4000;
const MAX_IMAGE_DATA_URL_LENGTH = 2_800_000; // ~2MB binary payload when base64 encoded

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

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

function isTxHash(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
}

/**
 * Funds a specific escrow for a job
 * @param params - { jobId: number; employerId: number }
 * @returns
 */
export async function prepareFundEscrowAction(params: {
  jobId: number;
  employerId: number;
}): Promise<PreparedSmartAccountTransactionResult> {
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
    };
  }

  const txRequest = await buildEscrowTransactionRequest({
    functionName: "fundJob",
    functionArgs: [jobId],
    amount: amountInWei,
    summary: `Fund escrow for job #${jobId}`,
  });

  return { success: true, txRequest };
}

export async function confirmFundEscrowAction(params: {
  jobId: number;
  employerId: number;
  txHash: string;
  userOpHash: string;
}): Promise<SmartAccountTransactionResult> {
  const { jobId, employerId, txHash, userOpHash } = params;

  const { success, errorMsg } = await validateJobDetails(
    jobId,
    JobStatus.POSTED,
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

  if (!isTxHash(txHash) || !isTxHash(userOpHash)) {
    return {
      success: false,
      errorMsg: "Invalid transaction hash format",
      txHash: "" as `0x${string}`,
      userOpHash: "" as `0x${string}`,
    };
  }

  await updateJobAfterFunding(jobId, txHash);
  return { success: true, txHash, userOpHash };
}

/**
 * A worker accepts a particular job through this action.
 * @param params - { jobId: number; workerId: number }
 * @returns
 */
export async function prepareAcceptJobAction(params: {
  jobId: number;
  workerId: number;
}): Promise<PreparedSmartAccountTransactionResult> {
  const { jobId, workerId } = params;

  const { success, errorMsg } = await validateJobDetails(
    jobId,
    JobStatus.FUNDED,
  );
  if (!success) {
    return {
      success: false,
      errorMsg,
    };
  }

  const txRequest = await buildEscrowTransactionRequest({
    functionName: "acceptJob",
    functionArgs: [jobId],
    summary: `Accept job #${jobId}`,
  });

  return { success: true, txRequest };
}

export async function confirmAcceptJobAction(params: {
  jobId: number;
  workerId: number;
  txHash: string;
  userOpHash: string;
}): Promise<SmartAccountTransactionResult> {
  const { jobId, workerId, txHash, userOpHash } = params;

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

  if (!isTxHash(txHash) || !isTxHash(userOpHash)) {
    return {
      success: false,
      errorMsg: "Invalid transaction hash format",
      txHash: "" as `0x${string}`,
      userOpHash: "" as `0x${string}`,
    };
  }

  const workerWalletAddress = await getWalletAddress(workerId);
  await updateJobAfterAcceptJob(jobId, workerWalletAddress, txHash);
  return { success: true, txHash, userOpHash };
}

/**
 * A worker applies for fund release after completing the job.
 * @param params - { jobId: number; workerId: number }
 * @returns
 */
export async function prepareApplyFundReleaseAction(params: {
  jobId: number;
  workerId: number;
  evidenceText: string;
  evidenceImageDataUrl?: string;
}): Promise<PreparedSmartAccountTransactionResult> {
  const { jobId, workerId, evidenceText, evidenceImageDataUrl } = params;

  const trimmedEvidence = evidenceText.trim();
  if (!trimmedEvidence) {
    return {
      success: false,
      errorMsg: "Evidence text is required before applying for fund release",
    };
  }

  if (trimmedEvidence.length > MAX_RELEASE_EVIDENCE_TEXT_LENGTH) {
    return {
      success: false,
      errorMsg: `Evidence text must be <= ${MAX_RELEASE_EVIDENCE_TEXT_LENGTH} characters`,
    };
  }

  const normalisedImageDataUrl = evidenceImageDataUrl?.trim() || "";
  if (normalisedImageDataUrl) {
    const isInlineImage = normalisedImageDataUrl.startsWith("data:image/");
    const isRemoteImage = isHttpUrl(normalisedImageDataUrl);

    if (!isInlineImage && !isRemoteImage) {
      return {
        success: false,
        errorMsg: "Evidence image must be a valid URL or image data URL",
      };
    }

    if (
      isInlineImage &&
      normalisedImageDataUrl.length > MAX_IMAGE_DATA_URL_LENGTH
    ) {
      return {
        success: false,
        errorMsg: "Evidence image is too large. Please keep it under 2MB",
      };
    }
  }

  const { success, errorMsg } = await validateJobDetails(
    jobId,
    JobStatus.IN_PROGRESS,
  );
  if (!success) {
    return {
      success: false,
      errorMsg,
    };
  }

  const job = await getJobDetails(jobId);
  if (!job) {
    return {
      success: false,
      errorMsg: "Job not found",
    };
  }

  const workerWalletAddress = await getWalletAddress(workerId);
  if (
    !job.workerWallet ||
    job.workerWallet.toLowerCase() !== workerWalletAddress.toLowerCase()
  ) {
    return {
      success: false,
      errorMsg:
        "Unauthorized: only the assigned worker can apply for fund release",
    };
  }

  const txRequest = await buildEscrowTransactionRequest({
    functionName: "requestRelease",
    functionArgs: [jobId],
    summary: `Request fund release for job #${jobId}`,
  });

  return { success: true, txRequest };
}

export async function confirmApplyFundReleaseAction(params: {
  jobId: number;
  workerId: number;
  evidenceText: string;
  evidenceImageDataUrl?: string;
  txHash: string;
  userOpHash: string;
}): Promise<SmartAccountTransactionResult> {
  const {
    jobId,
    workerId,
    evidenceText,
    evidenceImageDataUrl,
    txHash,
    userOpHash,
  } = params;

  if (!isTxHash(txHash) || !isTxHash(userOpHash)) {
    return {
      success: false,
      errorMsg: "Invalid transaction hash format",
      txHash: "" as `0x${string}`,
      userOpHash: "" as `0x${string}`,
    };
  }

  const job = await getJobDetails(jobId);
  if (!job) {
    return {
      success: false,
      errorMsg: "Job not found",
      txHash: "" as `0x${string}`,
      userOpHash: "" as `0x${string}`,
    };
  }

  const workerWalletAddress = await getWalletAddress(workerId);
  if (
    !job.workerWallet ||
    job.workerWallet.toLowerCase() !== workerWalletAddress.toLowerCase()
  ) {
    return {
      success: false,
      errorMsg:
        "Unauthorized: only the assigned worker can apply for fund release",
      txHash: "" as `0x${string}`,
      userOpHash: "" as `0x${string}`,
    };
  }

  await updateJobAfterApplyFundRelease(jobId, txHash, {
    uploadedBy: workerId,
    notes: evidenceText.trim(),
    fileUrl: evidenceImageDataUrl?.trim() || null,
  });

  return { success: true, txHash, userOpHash };
}

export async function getReleaseEvidencesForJobAction(params: {
  jobId: number;
  requesterUserId: number;
  requesterRole: UserRole;
  requesterWalletAddress?: string | null;
}): Promise<ReleaseEvidenceItem[]> {
  const { jobId, requesterUserId, requesterRole, requesterWalletAddress } =
    params;

  const job = await getJobDetails(jobId);
  if (!job) {
    throw new Error("Job not found");
  }

  const isAdmin = requesterRole === UserRole.ADMIN;
  const isEmployer = job.employerId === requesterUserId;
  const isAssignedWorker =
    !!job.workerWallet &&
    !!requesterWalletAddress &&
    job.workerWallet.toLowerCase() === requesterWalletAddress.toLowerCase();

  if (!isAdmin && !isEmployer && !isAssignedWorker) {
    throw new Error(
      "Unauthorized: only participants can view release evidence",
    );
  }

  const rows = await getReleaseEvidencesByJobId(jobId);
  return rows.map((item) => ({
    ...item,
    uploadedAt: item.uploadedAt.toISOString(),
  }));
}

/**
 * An employer accepts the fund release request from a worker.
 * @param params - { jobId: number; employerId: number }
 * @returns
 */
export async function prepareAcceptFundReleaseAction(params: {
  jobId: number;
  employerId: number;
}): Promise<PreparedSmartAccountTransactionResult> {
  const { jobId, employerId } = params;

  const releaseEvidences = await getReleaseEvidencesByJobId(jobId);
  if (releaseEvidences.length === 0) {
    return {
      success: false,
      errorMsg:
        "Cannot approve fund release: worker evidence is required before approval",
    };
  }

  const { success, errorMsg } = await validateJobDetails(
    jobId,
    JobStatus.PENDING_APPROVAL,
  );
  if (!success) {
    return {
      success: false,
      errorMsg,
    };
  }

  const txRequest = await buildEscrowTransactionRequest({
    functionName: "approveRelease",
    functionArgs: [jobId],
    summary: `Approve fund release for job #${jobId}`,
  });

  return { success: true, txRequest };
}

export async function confirmAcceptFundReleaseAction(params: {
  jobId: number;
  employerId: number;
  txHash: string;
  userOpHash: string;
}): Promise<SmartAccountTransactionResult> {
  const { jobId, employerId, txHash, userOpHash } = params;

  const { success, errorMsg } = await validateJobDetails(
    jobId,
    JobStatus.PENDING_APPROVAL,
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

  if (!isTxHash(txHash) || !isTxHash(userOpHash)) {
    return {
      success: false,
      errorMsg: "Invalid transaction hash format",
      txHash: "" as `0x${string}`,
      userOpHash: "" as `0x${string}`,
    };
  }

  await updateJobAfterAcceptFundRelease(jobId, txHash);
  return { success: true, txHash, userOpHash };
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
export async function prepareRefundPaymentAction(params: {
  jobId: number;
  employerId: number;
}): Promise<PreparedSmartAccountTransactionResult> {
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
    };
  }

  const txRequest = await buildEscrowTransactionRequest({
    functionName: "cancelJob",
    functionArgs: [jobId],
    summary: `Refund escrow for job #${jobId}`,
  });

  return { success: true, txRequest };
}

export async function confirmRefundPaymentAction(params: {
  jobId: number;
  employerId: number;
  txHash: string;
  userOpHash: string;
}): Promise<SmartAccountTransactionResult> {
  const { jobId, employerId, txHash, userOpHash } = params;

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

  if (!isTxHash(txHash) || !isTxHash(userOpHash)) {
    return {
      success: false,
      errorMsg: "Invalid transaction hash format",
      txHash: "" as `0x${string}`,
      userOpHash: "" as `0x${string}`,
    };
  }

  await updateJobAfterRefundPayment(jobId);
  return { success: true, txHash, userOpHash };
}
