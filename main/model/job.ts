import { Job, JobStatus } from "@/generated/prisma-client";
import { prisma } from "@/lib/db";
import { JobListingsResult } from "@/types";

export async function createJobListing(
  title: string,
  description: string,
  payment: number,
  employerId: number
) {
  try {
    await prisma.job.create({
      data: {
        title,
        employerId,
        description,
        amount: payment,
        status: JobStatus.POSTED,
      },
    });
  } catch (error) {
    console.error("Error creating job listing:", error);
    throw new Error(
      "Failed to create job listing: " + (error as Error).message
    );
  }
}

export async function getJobListings(
  page: number,
  pageSize: number
): Promise<JobListingsResult> {
  try {
    const [rows, total] = await Promise.all([
      prisma.job.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.job.count(),
    ]);
    const items = rows.map((job) => ({
      ...job,
      amount: Number(job.amount),
    }));

    return {
      items,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  } catch (error) {
    console.error("Error fetching list of jobs:", error);
    throw new Error("Error fetching list of jobs: " + (error as Error).message);
  }
}

export async function getJobDetails(jobId: number): Promise<Job | null> {
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });
    return job;
  } catch (error) {
    console.error("Error fetching job details:", error);
    throw new Error("Error fetching job details: " + (error as Error).message);
  }
}

export async function updateJobAfterFunding(jobId: number, txHash: string) {
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "FUNDED",
        fundedAt: new Date(),
        fundedTxHash: txHash,
      },
    });
  } catch (error) {
    console.error("Error updating job after funding:", error);
    throw new Error(
      "Error updating job after funding: " + (error as Error).message
    );
  }
}

export async function updateJobAfterAcceptJob(
  jobId: number,
  workerWallet: string,
  txHash: string
) {
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.IN_PROGRESS,
        workerWallet,
        acceptTxHash: txHash,
        acceptedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error updating job after acceptance:", error);
    throw new Error(
      "Error updating job after acceptance: " + (error as Error).message
    );
  }
}

export async function updateJobAfterApplyFundRelease(
  jobId: number,
  txHash: string
) {
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        applyReleaseTxHash: txHash,
        applyReleaseAt: new Date(),
        status: JobStatus.PENDING_APPROVAL,
      },
    });
  } catch (error) {
    console.error("Error updating job after applying for fund release:", error);
    throw new Error(
      "Error updating job after applying for fund release: " +
        (error as Error).message
    );
  }
}

export async function updateJobAfterAcceptFundRelease(
  jobId: number,
  txHash: string
) {
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.COMPLETED,
        approveReleaseTxHash: txHash,
        approveReleaseAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error updating job after approving fund release:", error);
    throw new Error(
      "Error updating job after approving fund release: " +
        (error as Error).message
    );
  }
}

export async function deleteJobListing(jobId: number) {
  try {
    await prisma.job.delete({
      where: { id: jobId },
    });
  } catch (error) {
    console.error("Error deleting job listing:", error);
    throw new Error("Error deleting job listing: " + (error as Error).message);
  }
}

export async function updateJobAfterRefundPayment(jobId: number) {
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.POSTED,
        fundedAt: null,
        fundedTxHash: null,
      },
    });
  } catch (error) {
    console.error("Error updating job after refunding payment:", error);
    throw new Error(
      "Error updating job after refunding payment: " + (error as Error).message
    );
  }
}
