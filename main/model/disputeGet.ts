import { prisma } from "@/lib/db";
import { JobStatus } from "@/generated/prisma-client";
import {
  DbDispute,
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
  const rows = await prisma.$queryRaw<DbDispute[]>`
    SELECT *
    FROM "app_service"."disputes"
    WHERE "jobId" = ${jobId}
      AND "status" IN ('OPEN', 'EVIDENCE_SUBMISSION', 'UNDER_REVIEW', 'DECIDED', 'ONCHAIN_PENDING')
    ORDER BY "id" DESC
    LIMIT 1
  `;

  return rows[0] ?? null;
}

// List all disputes where the user is involved either as an employer or worker.
export async function listDisputesForUser(userId: number) {
  return prisma.$queryRaw<DbDispute[]>`
    SELECT d.*
    FROM "app_service"."disputes" d
    JOIN "app_service"."jobs" j ON j."id" = d."jobId"
    LEFT JOIN "app_service"."wallets" w
      ON w."userId" = ${userId}
      AND w."status" = 'ACTIVE'::"app_service"."WalletStatus"
    WHERE j."employerId" = ${userId}
      OR j."workerWallet" = w."address"
    ORDER BY d."createdAt" DESC
  `;
}

// List all disputes that are currently open or in progress, ordered by oldest first.
export async function listOpenDisputes() {
  return prisma.$queryRaw<DbDispute[]>`
    SELECT *
    FROM "app_service"."disputes"
    WHERE "status" IN ('OPEN', 'EVIDENCE_SUBMISSION', 'UNDER_REVIEW', 'DECIDED', 'ONCHAIN_PENDING')
    ORDER BY "createdAt" ASC
  `;
}

// Get detailed information about a dispute, including related job and user info, and all evidence submitted.
export async function getDisputeDetails(
  disputeId: number,
): Promise<DisputeWithRelations | null> {
  const disputes = await prisma.$queryRaw<DisputeWithRelations[]>`
    SELECT d.*,
      row_to_json(j.*) as job,
      row_to_json(ob.*) as "openedBy",
      row_to_json(db.*) as "decidedBy",
      (
        SELECT COALESCE(json_agg(e ORDER BY e."createdAt" ASC), '[]'::json)
        FROM "app_service"."dispute_evidence" e
        WHERE e."disputeId" = d."id"
      ) as evidences
    FROM "app_service"."disputes" d
    JOIN "app_service"."jobs" j ON j."id" = d."jobId"
    JOIN "app_service"."users" ob ON ob."id" = d."openedByUserId"
    LEFT JOIN "app_service"."users" db ON db."id" = d."decidedByAdminId"
    WHERE d."id" = ${disputeId}
    LIMIT 1
  `;

  return disputes[0] ?? null;
}

// Fetch basic dispute information by ID without related data, used for quick checks like existence or status.
export async function getDisputeByIdBasic(
  disputeId: number,
): Promise<DbDispute | null> {
  const rows = await prisma.$queryRaw<DbDispute[]>`
    SELECT *
    FROM "app_service"."disputes"
    WHERE "id" = ${disputeId}
    LIMIT 1
  `;
  return rows[0] ?? null;
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
