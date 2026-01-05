import { Job, JobStatus } from "@/generated/prisma-client";
import { prisma } from "@/lib/db";
import { ESCROW_CONTRACT_ADDRESS } from "@/lib/ether";
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

export async function updateJobAfterFunding(jobId: number) {
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "FUNDED",
        escrowAddress: ESCROW_CONTRACT_ADDRESS,
        onChainJobId: jobId,
      },
    });
  } catch (error) {
    console.error("Error updating job after funding:", error);
    throw new Error(
      "Error updating job after funding: " + (error as Error).message
    );
  }
}
