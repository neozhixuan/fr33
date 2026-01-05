"use server";

import { Job } from "@/generated/prisma-client";
import {
  createJobListing,
  getJobDetails,
  getJobListings,
  updateJobAfterFunding,
} from "@/model/job";
import { JobListingsResult } from "@/types";
import { redirect } from "next/navigation";
import {
  ESCROW_CONTRACT_ADDRESS,
  getContract,
  getProvider,
  parseEther,
} from "./ether";
import { sendSmartAccountTransaction } from "./aaActions";

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
}) {
  const { jobId, employerId } = params;

  // 1. Get job from DB
  const job = await getJobDetails(jobId);
  if (!job) throw new Error("Job not found");
  if (job.status !== "POSTED") throw new Error("Job already funded");

  // 2. Connect to contract with employer's wallet
  const contract = getContract(getProvider());
  const amountInWei = parseEther(job.amount.toString());
  const callData = contract.interface.encodeFunctionData("createEscrow", [
    jobId,
  ]);

  // 3. Send transaction via smart account
  const { txHash, userOpHash } = await sendSmartAccountTransaction(
    employerId,
    ESCROW_CONTRACT_ADDRESS,
    callData,
    amountInWei
  );

  // 4. update db with funded status
  await updateJobAfterFunding(jobId);

  return { success: true, txHash, userOpHash };
}
