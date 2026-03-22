import { prisma } from "@/lib/db";
import { JobStatus, UserRole } from "@/generated/prisma-client";
import {
  ACTIVE_DISPUTE_STATUSES,
  DisputeEvidenceType,
  DisputeOutcome,
  DisputeStatus,
  EVIDENCE_ALLOWED_STATUSES,
} from "@/utils/dispute";

type DbDispute = {
  id: number;
  jobId: number;
  openedByUserId: number;
  status: DisputeStatus;
  freezeTxHash: string | null;
  resolutionTxHash: string | null;
  decision: DisputeOutcome | null;
  decisionReason: string | null;
  adminReviewNote: string | null;
  decidedByAdminId: number | null;
  openedAt: Date;
  decidedAt: Date | null;
  resolvedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type DbDisputeEvidence = {
  id: number;
  disputeId: number;
  submittedByUserId: number;
  submittedByRole: UserRole;
  evidenceType: DisputeEvidenceType;
  contentText: string;
  attachmentUrl: string | null;
  externalRef: string | null;
  idempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type DisputeWithRelations = DbDispute & {
  job: {
    id: number;
    employerId: number;
    workerWallet: string | null;
    title: string;
    status: JobStatus;
    applyReleaseAt: Date | null;
  };
  openedBy: { id: number; email: string; role: UserRole };
  decidedBy: { id: number; email: string; role: UserRole } | null;
  evidences: DbDisputeEvidence[];
  decisionRecord: {
    id: number;
    outcome: DisputeOutcome;
    workerShareBps: number | null;
    rationale: string;
    decidedByAdminId: number;
    createdAt: Date;
  } | null;
};

export type UserDisputeContext = {
  id: number;
  role: UserRole;
  walletAddress: string | null;
};

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

export async function getActiveDisputeForJob(
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

export async function createDisputeAfterFreeze(params: {
  jobId: number;
  openedByUserId: number;
  freezeTxHash: string;
  reason?: string;
}) {
  const { jobId, openedByUserId, freezeTxHash, reason } = params;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.$queryRaw<DbDispute[]>`
      SELECT *
      FROM "app_service"."disputes"
      WHERE "jobId" = ${jobId}
        AND "status" IN ('OPEN', 'EVIDENCE_SUBMISSION', 'UNDER_REVIEW', 'DECIDED', 'ONCHAIN_PENDING')
      ORDER BY "id" DESC
      LIMIT 1
    `;

    if (existing[0]) {
      return existing[0];
    }

    await tx.job.update({
      where: { id: jobId },
      data: { status: JobStatus.DISPUTED },
    });

    const inserted = await tx.$queryRaw<DbDispute[]>`
      INSERT INTO "app_service"."disputes" (
        "jobId",
        "openedByUserId",
        "status",
        "freezeTxHash",
        "decisionReason",
        "openedAt",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${jobId},
        ${openedByUserId},
        'OPEN'::"app_service"."DisputeStatus",
        ${freezeTxHash},
        ${reason || null},
        NOW(),
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    await tx.$executeRaw`
      INSERT INTO "app_service"."dispute_audit_logs" (
        "disputeId",
        "actorUserId",
        "actorRole",
        "actionType",
        "metadata",
        "createdAt"
      )
      VALUES (
        ${inserted[0].id},
        ${openedByUserId},
        (
          SELECT "role"
          FROM "app_service"."users"
          WHERE "id" = ${openedByUserId}
        )::"app_service"."UserRole",
        'DISPUTE_CREATED'::"app_service"."DisputeAuditAction",
        jsonb_build_object('freezeTxHash', ${freezeTxHash}),
        NOW()
      )
    `;

    await tx.$executeRaw`
      INSERT INTO "app_service"."dispute_audit_logs" (
        "disputeId",
        "actorUserId",
        "actorRole",
        "actionType",
        "metadata",
        "createdAt"
      )
      VALUES (
        ${inserted[0].id},
        ${openedByUserId},
        (
          SELECT "role"
          FROM "app_service"."users"
          WHERE "id" = ${openedByUserId}
        )::"app_service"."UserRole",
        'ESCROW_FREEZE_SUCCEEDED'::"app_service"."DisputeAuditAction",
        jsonb_build_object('freezeTxHash', ${freezeTxHash}),
        NOW()
      )
    `;

    return inserted[0];
  });
}

export async function addDisputeAuditLog(params: {
  disputeId: number;
  actionType:
    | "DISPUTE_CREATED"
    | "ESCROW_FREEZE_REQUESTED"
    | "ESCROW_FREEZE_SUCCEEDED"
    | "ESCROW_FREEZE_FAILED"
    | "EVIDENCE_SUBMITTED"
    | "REVIEW_NOTE_ADDED"
    | "DECISION_RECORDED"
    | "ONCHAIN_RESOLUTION_SUBMITTED"
    | "ONCHAIN_RESOLUTION_CONFIRMED"
    | "ONCHAIN_RESOLUTION_FAILED"
    | "TIMEOUT_AUTO_RELEASE_TRIGGERED"
    | "TIMEOUT_AUTO_RELEASE_CONFIRMED"
    | "TIMEOUT_AUTO_RELEASE_FAILED";
  actorUserId?: number | null;
  actorRole?: UserRole | null;
  metadata?: unknown;
}) {
  const { disputeId, actionType, actorUserId, actorRole, metadata } = params;

  await prisma.$executeRaw`
    INSERT INTO "app_service"."dispute_audit_logs" (
      "disputeId",
      "actorUserId",
      "actorRole",
      "actionType",
      "metadata",
      "createdAt"
    )
    VALUES (
      ${disputeId},
      ${actorUserId ?? null},
      ${(actorRole ?? null) as UserRole | null},
      ${actionType}::"app_service"."DisputeAuditAction",
      ${metadata ? JSON.stringify(metadata) : null}::jsonb,
      NOW()
    )
  `;
}

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
    const disputeRows = await tx.$queryRaw<DbDispute[]>`
      SELECT *
      FROM "app_service"."disputes"
      WHERE "id" = ${disputeId}
      LIMIT 1
    `;

    const dispute = disputeRows[0];
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
      const existing = await tx.$queryRaw<DbDisputeEvidence[]>`
        SELECT *
        FROM "app_service"."dispute_evidence"
        WHERE "disputeId" = ${disputeId}
          AND "idempotencyKey" = ${idempotencyKey}
        LIMIT 1
      `;
      if (existing[0]) {
        return existing[0];
      }
    }

    const inserted = await tx.$queryRaw<DbDisputeEvidence[]>`
      INSERT INTO "app_service"."dispute_evidence" (
        "disputeId",
        "submittedByUserId",
        "submittedByRole",
        "evidenceType",
        "contentText",
        "attachmentUrl",
        "externalRef",
        "idempotencyKey",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${disputeId},
        ${submittedByUserId},
        ${submittedByRole}::"app_service"."UserRole",
        ${evidenceType}::"app_service"."DisputeEvidenceType",
        ${contentText},
        ${attachmentUrl || null},
        ${externalRef || null},
        ${idempotencyKey || null},
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    if (dispute.status === "OPEN") {
      await tx.$executeRaw`
        UPDATE "app_service"."disputes"
        SET "status" = 'EVIDENCE_SUBMISSION'::"app_service"."DisputeStatus",
            "updatedAt" = NOW()
        WHERE "id" = ${disputeId}
      `;
    }

    await tx.$executeRaw`
      INSERT INTO "app_service"."dispute_audit_logs" (
        "disputeId",
        "actorUserId",
        "actorRole",
        "actionType",
        "metadata",
        "createdAt"
      )
      VALUES (
        ${disputeId},
        ${submittedByUserId},
        ${submittedByRole}::"app_service"."UserRole",
        'EVIDENCE_SUBMITTED'::"app_service"."DisputeAuditAction",
        jsonb_build_object('evidenceId', ${inserted[0].id}, 'evidenceType', ${evidenceType}),
        NOW()
      )
    `;

    return inserted[0];
  });
}

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
      ) as evidences,
      (
        SELECT row_to_json(dd.*)
        FROM "app_service"."dispute_decisions" dd
        WHERE dd."disputeId" = d."id"
      ) as "decisionRecord"
    FROM "app_service"."disputes" d
    JOIN "app_service"."jobs" j ON j."id" = d."jobId"
    JOIN "app_service"."users" ob ON ob."id" = d."openedByUserId"
    LEFT JOIN "app_service"."users" db ON db."id" = d."decidedByAdminId"
    WHERE d."id" = ${disputeId}
    LIMIT 1
  `;

  return disputes[0] ?? null;
}

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

export async function listOpenDisputes() {
  return prisma.$queryRaw<DbDispute[]>`
    SELECT *
    FROM "app_service"."disputes"
    WHERE "status" IN ('OPEN', 'EVIDENCE_SUBMISSION', 'UNDER_REVIEW', 'DECIDED', 'ONCHAIN_PENDING')
    ORDER BY "createdAt" ASC
  `;
}

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

export async function addAdminReviewNote(params: {
  disputeId: number;
  adminUserId: number;
  note: string;
}) {
  const { disputeId, adminUserId, note } = params;

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE "app_service"."disputes"
      SET
        "adminReviewNote" = COALESCE("adminReviewNote", '') || CASE
          WHEN "adminReviewNote" IS NULL OR "adminReviewNote" = '' THEN ${note}
          ELSE E'\n---\n' || ${note}
        END,
        "status" = CASE
          WHEN "status" IN ('OPEN', 'EVIDENCE_SUBMISSION') THEN 'UNDER_REVIEW'::"app_service"."DisputeStatus"
          ELSE "status"
        END,
        "updatedAt" = NOW()
      WHERE "id" = ${disputeId}
    `;

    await tx.$executeRaw`
      INSERT INTO "app_service"."dispute_audit_logs" (
        "disputeId", "actorUserId", "actorRole", "actionType", "metadata", "createdAt"
      )
      VALUES (
        ${disputeId},
        ${adminUserId},
        'ADMIN'::"app_service"."UserRole",
        'REVIEW_NOTE_ADDED'::"app_service"."DisputeAuditAction",
        jsonb_build_object('note', ${note}),
        NOW()
      )
    `;
  });
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
    const existingDecision = await tx.$queryRaw<{ id: number }[]>`
      SELECT "id"
      FROM "app_service"."dispute_decisions"
      WHERE "disputeId" = ${disputeId}
      LIMIT 1
    `;

    if (existingDecision[0]) {
      await tx.$executeRaw`
        UPDATE "app_service"."dispute_decisions"
        SET
          "outcome" = ${outcome}::"app_service"."DisputeOutcome",
          "workerShareBps" = ${workerShareBps ?? null},
          "rationale" = ${rationale},
          "updatedAt" = NOW()
        WHERE "disputeId" = ${disputeId}
      `;
    } else {
      await tx.$executeRaw`
        INSERT INTO "app_service"."dispute_decisions" (
          "disputeId", "decidedByAdminId", "outcome", "workerShareBps", "rationale", "createdAt", "updatedAt"
        )
        VALUES (
          ${disputeId},
          ${adminUserId},
          ${outcome}::"app_service"."DisputeOutcome",
          ${workerShareBps ?? null},
          ${rationale},
          NOW(),
          NOW()
        )
      `;
    }

    await tx.$executeRaw`
      UPDATE "app_service"."disputes"
      SET
        "decision" = ${outcome}::"app_service"."DisputeOutcome",
        "decisionReason" = ${rationale},
        "decidedByAdminId" = ${adminUserId},
        "decidedAt" = NOW(),
        "status" = 'ONCHAIN_PENDING'::"app_service"."DisputeStatus",
        "updatedAt" = NOW()
      WHERE "id" = ${disputeId}
        AND "status" IN ('OPEN', 'EVIDENCE_SUBMISSION', 'UNDER_REVIEW', 'DECIDED', 'ONCHAIN_PENDING')
    `;

    await tx.$executeRaw`
      INSERT INTO "app_service"."dispute_audit_logs" (
        "disputeId", "actorUserId", "actorRole", "actionType", "metadata", "createdAt"
      )
      VALUES (
        ${disputeId},
        ${adminUserId},
        'ADMIN'::"app_service"."UserRole",
        'DECISION_RECORDED'::"app_service"."DisputeAuditAction",
        jsonb_build_object('outcome', ${outcome}, 'workerShareBps', ${
      workerShareBps ?? null
    }),
        NOW()
      )
    `;
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
    const disputes = await tx.$queryRaw<DbDispute[]>`
      SELECT *
      FROM "app_service"."disputes"
      WHERE "id" = ${disputeId}
      LIMIT 1
    `;

    const dispute = disputes[0];
    if (!dispute) {
      throw new Error("Dispute not found");
    }

    await tx.$executeRaw`
      UPDATE "app_service"."disputes"
      SET
        "status" = 'RESOLVED'::"app_service"."DisputeStatus",
        "resolutionTxHash" = ${resolutionTxHash},
        "resolvedAt" = NOW(),
        "updatedAt" = NOW()
      WHERE "id" = ${disputeId}
    `;

    await tx.job.update({
      where: { id: dispute.jobId },
      data: {
        status: finalJobStatus,
        approveReleaseAt: new Date(),
        approveReleaseTxHash: resolutionTxHash,
      },
    });

    await tx.$executeRaw`
      INSERT INTO "app_service"."dispute_audit_logs" (
        "disputeId", "actionType", "metadata", "createdAt"
      )
      VALUES (
        ${disputeId},
        'ONCHAIN_RESOLUTION_CONFIRMED'::"app_service"."DisputeAuditAction",
        jsonb_build_object('txHash', ${resolutionTxHash}),
        NOW()
      )
    `;
  });
}

export async function markDisputeOnchainResolutionFailed(params: {
  disputeId: number;
  errorMsg: string;
}) {
  const { disputeId, errorMsg } = params;

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE "app_service"."disputes"
      SET
        "status" = 'DECIDED'::"app_service"."DisputeStatus",
        "updatedAt" = NOW()
      WHERE "id" = ${disputeId}
        AND "status" = 'ONCHAIN_PENDING'::"app_service"."DisputeStatus"
    `;

    await tx.$executeRaw`
      INSERT INTO "app_service"."dispute_audit_logs" (
        "disputeId", "actionType", "metadata", "createdAt"
      )
      VALUES (
        ${disputeId},
        'ONCHAIN_RESOLUTION_FAILED'::"app_service"."DisputeAuditAction",
        jsonb_build_object('error', ${errorMsg}),
        NOW()
      )
    `;
  });
}

export async function markDisputeFrozenByAdmin(params: {
  disputeId: number;
  adminUserId: number;
  freezeTxHash: string;
}) {
  const { disputeId, adminUserId, freezeTxHash } = params;

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE "app_service"."disputes"
      SET
        "status" = CASE
          WHEN "status" = 'OPEN'::"app_service"."DisputeStatus" THEN 'UNDER_REVIEW'::"app_service"."DisputeStatus"
          ELSE "status"
        END,
        "freezeTxHash" = COALESCE("freezeTxHash", ${freezeTxHash}),
        "updatedAt" = NOW()
      WHERE "id" = ${disputeId}
    `;

    await tx.$executeRaw`
      INSERT INTO "app_service"."dispute_audit_logs" (
        "disputeId", "actorUserId", "actorRole", "actionType", "metadata", "createdAt"
      )
      VALUES (
        ${disputeId},
        ${adminUserId},
        'ADMIN'::"app_service"."UserRole",
        'ESCROW_FREEZE_SUCCEEDED'::"app_service"."DisputeAuditAction",
        jsonb_build_object('freezeTxHash', ${freezeTxHash}, 'initiatedBy', 'admin'),
        NOW()
      )
    `;
  });
}

export async function getDisputeAuditTrail(disputeId: number) {
  return prisma.$queryRaw<
    {
      id: number;
      disputeId: number;
      actorUserId: number | null;
      actorRole: UserRole | null;
      actionType: string;
      metadata: unknown;
      createdAt: Date;
    }[]
  >`
    SELECT *
    FROM "app_service"."dispute_audit_logs"
    WHERE "disputeId" = ${disputeId}
    ORDER BY "createdAt" ASC, "id" ASC
  `;
}

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

export async function hasActiveDisputeForJob(jobId: number): Promise<boolean> {
  const active = await getActiveDisputeForJob(jobId);
  return Boolean(
    active &&
      ACTIVE_DISPUTE_STATUSES.includes(
        active.status as (typeof ACTIVE_DISPUTE_STATUSES)[number],
      ),
  );
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
