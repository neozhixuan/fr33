import { prisma } from "@/lib/db";
import { JobStatus, UserRole } from "@/generated/prisma-client";
import {
  ACTIVE_DISPUTE_STATUSES,
  EVIDENCE_ALLOWED_STATUSES,
} from "@/utils/disputeUtils";
import { DisputeEvidenceType, DisputeOutcome } from "@/type/disputeTypes";

// Create a dispute for a job after an escrow freeze has been initiated, ensuring that only one active dispute exists for the job at any time.
// This is used when a user initiates a dispute and we need to record it in the database along with the freeze transaction hash.
export async function createDisputeAfterFreeze(params: {
  jobId: number;
  openedByUserId: number;
  freezeTxHash: string;
  reason?: string;
}) {
  const { jobId, openedByUserId, freezeTxHash, reason } = params;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.dispute.findFirst({
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

    if (existing) {
      return existing;
    }

    await tx.job.update({
      where: { id: jobId },
      data: { status: JobStatus.DISPUTED },
    });

    const inserted = await tx.dispute.create({
      data: {
        jobId,
        openedByUserId,
        freezeTxHash,
        decisionReason: reason || null,
      },
    });

    const actor = await tx.user.findUnique({
      where: { id: openedByUserId },
      select: { role: true },
    });

    await tx.auditLog.create({
      data: {
        userId: openedByUserId,
        action: "DISPUTE_CREATED",
        result: "ALLOWED",
        metadata: {
          disputeId: inserted.id,
          jobId,
          actorRole: actor?.role ?? null,
          freezeTxHash,
        },
      },
    });

    await tx.auditLog.create({
      data: {
        userId: openedByUserId,
        action: "ESCROW_FREEZE_SUCCEEDED",
        result: "ALLOWED",
        metadata: {
          disputeId: inserted.id,
          jobId,
          actorRole: actor?.role ?? null,
          freezeTxHash,
        },
      },
    });

    return inserted;
  });
}

// Add evidence to an existing dispute
export async function addDisputeEvidence(params: {
  disputeId: number;
  submittedByUserId: number;
  submittedByRole: UserRole;
  evidenceType: DisputeEvidenceType;
  contentText: string;
  attachmentUrl?: string | null;
  externalRef?: string | null;
  idempotencyKey?: string | null;
}) {
  const {
    disputeId,
    submittedByUserId,
    submittedByRole,
    evidenceType,
    contentText,
    attachmentUrl,
    externalRef,
    idempotencyKey,
  } = params;

  return prisma.$transaction(async (tx) => {
    const dispute = await tx.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new Error("Dispute not found");
    }

    if (
      !EVIDENCE_ALLOWED_STATUSES.includes(
        dispute.status as (typeof EVIDENCE_ALLOWED_STATUSES)[number],
      )
    ) {
      throw new Error(
        `Evidence is not accepted in dispute status ${dispute.status}`,
      );
    }

    if (idempotencyKey) {
      const existing = await tx.disputeEvidence.findFirst({
        where: {
          disputeId,
          idempotencyKey,
        },
      });
      if (existing) {
        return existing;
      }
    }

    const inserted = await tx.disputeEvidence.create({
      data: {
        disputeId,
        submittedByUserId,
        submittedByRole,
        evidenceType,
        contentText,
        attachmentUrl: attachmentUrl || null,
        externalRef: externalRef || null,
        idempotencyKey: idempotencyKey || null,
      },
    });

    if (dispute.status === "OPEN") {
      await tx.dispute.update({
        where: { id: disputeId },
        data: { status: "EVIDENCE_SUBMISSION" },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: submittedByUserId,
        action: "EVIDENCE_SUBMITTED",
        result: "ALLOWED",
        metadata: {
          disputeId,
          actorRole: submittedByRole,
          evidenceId: inserted.id,
          evidenceType,
        },
      },
    });

    return inserted;
  });
}

// Checks if the user is a participant in the dispute (either as employer or worker) and returns their role.
// This is used for authorization checks when users interact with disputes to ensure they can only access disputes they are involved in.
export async function assertDisputeParticipant(params: {
  disputeId: number;
  userId: number;
}) {
  const { disputeId, userId } = params;

  const rows = await prisma.$queryRaw<{ ok: boolean; role: UserRole | null }[]>`
    SELECT
      (
        j."employerId" = ${userId}
        OR j."workerWallet" = (
          SELECT w."address"
          FROM "app_service"."wallets" w
          WHERE w."userId" = ${userId}
            AND w."status" = 'ACTIVE'::"app_service"."WalletStatus"
          ORDER BY w."id" DESC
          LIMIT 1
        )
      ) AS ok,
      (
        SELECT u."role"
        FROM "app_service"."users" u
        WHERE u."id" = ${userId}
      ) AS role
    FROM "app_service"."disputes" d
    JOIN "app_service"."jobs" j ON j."id" = d."jobId"
    WHERE d."id" = ${disputeId}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row?.ok) {
    throw new Error("Unauthorized: you are not a participant in this dispute");
  }

  return row.role ?? null;
}

export async function setDisputeDecisionPendingOnchain(params: {
  disputeId: number;
  adminUserId: number;
  outcome: DisputeOutcome;
  rationale: string;
  workerShareBps?: number | null;
}) {
  const { disputeId, adminUserId, outcome, rationale, workerShareBps } = params;

  await prisma.$transaction(async (tx) => {
    await tx.dispute.updateMany({
      where: {
        id: disputeId,
        status: {
          in: [...ACTIVE_DISPUTE_STATUSES],
        },
      },
      data: {
        decision: outcome,
        workerShareBps: workerShareBps ?? null,
        decisionReason: rationale,
        decidedByAdminId: adminUserId,
        decidedAt: new Date(),
        status: "ONCHAIN_PENDING",
      },
    });

    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: "DECISION_RECORDED",
        result: "ALLOWED",
        metadata: {
          disputeId,
          actorRole: UserRole.ADMIN,
          outcome,
          workerShareBps: workerShareBps ?? null,
          rationale,
        },
      },
    });
  });
}

export async function markDisputeOnchainResolved(params: {
  disputeId: number;
  resolutionTxHash: string;
  finalJobStatus?: JobStatus;
}) {
  const {
    disputeId,
    resolutionTxHash,
    finalJobStatus = JobStatus.COMPLETED,
  } = params;

  await prisma.$transaction(async (tx) => {
    const dispute = await tx.dispute.findUnique({
      where: { id: disputeId },
      select: { jobId: true },
    });

    if (!dispute) {
      throw new Error("Dispute not found");
    }

    await tx.dispute.update({
      where: { id: disputeId },
      data: {
        status: "RESOLVED",
        resolutionTxHash,
        resolvedAt: new Date(),
      },
    });

    await tx.job.update({
      where: { id: dispute.jobId },
      data: {
        status: finalJobStatus,
        approveReleaseAt: new Date(),
        approveReleaseTxHash: resolutionTxHash,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "ONCHAIN_RESOLUTION_CONFIRMED",
        result: "ALLOWED",
        metadata: {
          disputeId,
          txHash: resolutionTxHash,
        },
      },
    });
  });
}

export async function markDisputeOnchainResolutionFailed(params: {
  disputeId: number;
  errorMsg: string;
}) {
  const { disputeId, errorMsg } = params;

  await prisma.$transaction(async (tx) => {
    await tx.dispute.updateMany({
      where: {
        id: disputeId,
        status: "ONCHAIN_PENDING",
      },
      data: {
        status: "DECIDED",
      },
    });

    await tx.auditLog.create({
      data: {
        action: "ONCHAIN_RESOLUTION_FAILED",
        result: "BLOCKED",
        metadata: {
          disputeId,
          error: errorMsg,
        },
      },
    });
  });
}

export async function markDisputeFrozenByAdmin(params: {
  disputeId: number;
  adminUserId: number;
  freezeTxHash: string;
}) {
  const { disputeId, adminUserId, freezeTxHash } = params;

  await prisma.$transaction(async (tx) => {
    const dispute = await tx.dispute.findUnique({
      where: { id: disputeId },
      select: { status: true, freezeTxHash: true },
    });

    if (!dispute) {
      throw new Error("Dispute not found");
    }

    await tx.dispute.update({
      where: { id: disputeId },
      data: {
        status: dispute.status === "OPEN" ? "UNDER_REVIEW" : dispute.status,
        freezeTxHash: dispute.freezeTxHash ?? freezeTxHash,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: "ESCROW_FREEZE_SUCCEEDED",
        result: "ALLOWED",
        metadata: {
          disputeId,
          actorRole: UserRole.ADMIN,
          freezeTxHash,
          initiatedBy: "admin",
        },
      },
    });
  });
}

export async function markJobTimeoutAutoReleased(params: {
  jobId: number;
  txHash: string;
}) {
  const { jobId, txHash } = params;
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: JobStatus.COMPLETED,
      approveReleaseAt: new Date(),
      approveReleaseTxHash: txHash,
    },
  });
}
