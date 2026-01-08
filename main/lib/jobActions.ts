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
  parseSGDToPolygon,
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
  const contract = await getContract(getProvider());
  const amountInWei = parseSGDToPolygon(job.amount.toString());
  const callData = contract.interface.encodeFunctionData("fundJob", [jobId]);

  // 3. Send transaction via smart account
  let txHashResult: string, userOpHashResult: string;
  try {
    const { txHash, userOpHash, success, errorMsg } =
      await sendSmartAccountTransaction(
        employerId,
        ESCROW_CONTRACT_ADDRESS,
        callData,
        amountInWei
      );
    if (!success) {
      throw new Error("Smart account transaction failed: " + errorMsg);
    }
    txHashResult = txHash;
    userOpHashResult = userOpHash;
  } catch (error) {
    console.error("Error funding escrow:", error);
    return {
      success: false,
      errorMsg: `Error funding escrow: ${(error as Error).message}`,
    };
  }

  // TODO: Verify on-chain state

  // 4. update db with funded status
  try {
    await updateJobAfterFunding(jobId, txHashResult);
  } catch (error) {
    console.error("Error updating job after funding:", error);
    return {
      success: false,
      errorMsg: `Error updating job after funding: ${(error as Error).message}`,
    };
  }

  return { success: true, txHashResult, userOpHashResult };
}
