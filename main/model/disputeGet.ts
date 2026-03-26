import { prisma } from "@/lib/db";
import { JobStatus } from "@/generated/prisma-client";
import {
  DbDispute,
  DbDisputeEvidence,
  DisputeWithRelations,
  UserDisputeContext,
} from "@/type/disputeTypes";
import { ACTIVE_DISPUTE_STATUSES } from "@/utils/disputeUtils";

// Get the dispute context for a user - their role and active wallet address if available.
// This is used to determine what actions they can take in relation to disputes.
export async function getUserDisputeContext(
  userId: number,
): Promise<UserDisputeContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      wallets: {
        where: { status: "ACTIVE" },
        select: { address: true },
        take: 1,
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    role: user.role,
    walletAddress: user.wallets[0]?.address ?? null,
  };
}

// Fetch all active disputes for a given job, ordered by most recent.
// This is used to check if a job is currently disputed.
async function getActiveDisputeForJob(
  jobId: number,
): Promise<DbDispute | null> {
  const dispute = await prisma.dispute.findFirst({
    where: {
      jobId,
      status: {
        in: [...ACTIVE_DISPUTE_STATUSES],
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  return (dispute as DbDispute | null) ?? null;
}

// List all disputes where the user is involved either as an employer or worker.
export async function listDisputesForUser(userId: number) {
  const activeWallet = await prisma.wallet.findFirst({
    where: {
      userId,
      status: "ACTIVE",
    },
    select: {
      address: true,
    },
    orderBy: {
      id: "desc",
    },
  });

  const disputes = await prisma.dispute.findMany({
    where: {
      OR: [
        {
          job: {
            employerId: userId,
          },
        },
        ...(activeWallet?.address
          ? [
              {
                job: {
                  workerWallet: activeWallet.address,
                },
              },
            ]
          : []),
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return disputes as DbDispute[];
}

// List all disputes that are currently open or in progress, ordered by oldest first.
export async function listOpenDisputes() {
  const disputes = await prisma.dispute.findMany({
    where: {
      status: {
        in: [...ACTIVE_DISPUTE_STATUSES],
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return disputes as DbDispute[];
}

// Get detailed information about a dispute, including related job and user info, and all evidence submitted.
export async function getDisputeDetails(
  disputeId: number,
): Promise<DisputeWithRelations | null> {
  const dispute = await prisma.dispute.findUnique({
    where: {
      id: disputeId,
    },
    include: {
      job: {
        select: {
          id: true,
          employerId: true,
          workerWallet: true,
          title: true,
          status: true,
          applyReleaseAt: true,
          fundedTxHash: true,
          acceptTxHash: true,
          applyReleaseTxHash: true,
          approveReleaseTxHash: true,
          releaseEvidences: {
            select: {
              id: true,
              type: true,
              fileUrl: true,
              notes: true,
              uploadedAt: true,
              uploadedBy: true,
            },
            orderBy: {
              uploadedAt: "asc",
            },
          },
        },
      },
      openedBy: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
      decidedBy: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
      evidences: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!dispute) {
    return null;
  }

  return {
    ...(dispute as DbDispute),
    job: dispute.job,
    openedBy: dispute.openedBy,
    decidedBy: dispute.decidedBy,
    evidences: dispute.evidences as DbDisputeEvidence[],
  };
}

// Fetch basic dispute information by ID without related data, used for quick checks like existence or status.
export async function getDisputeByIdBasic(
  disputeId: number,
): Promise<DbDispute | null> {
  const dispute = await prisma.dispute.findUnique({
    where: {
      id: disputeId,
    },
  });

  return (dispute as DbDispute | null) ?? null;
}

// Get jobs that have been in a pending release state for longer than the specified cutoff time,
// indicating they may be eligible for auto-release or dispute initiation.
export async function getTimeoutEligibleJobs(cutoff: Date) {
  return prisma.job.findMany({
    where: {
      status: JobStatus.PENDING_APPROVAL,
      applyReleaseAt: {
        lte: cutoff,
      },
      approveReleaseTxHash: null,
    },
    orderBy: {
      applyReleaseAt: "asc",
    },
  });
}

// Check if a given job currently has an active dispute that would prevent certain actions from being taken on the job.
export async function hasActiveDisputeForJob(jobId: number): Promise<boolean> {
  const active = await getActiveDisputeForJob(jobId);
  return Boolean(
    active &&
      ACTIVE_DISPUTE_STATUSES.includes(
        active.status as (typeof ACTIVE_DISPUTE_STATUSES)[number],
      ),
  );
}
