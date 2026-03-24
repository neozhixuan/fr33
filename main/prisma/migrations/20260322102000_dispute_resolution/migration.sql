-- CreateEnum
CREATE TYPE "app_service"."DisputeStatus" AS ENUM (
  'OPEN',
  'EVIDENCE_SUBMISSION',
  'UNDER_REVIEW',
  'DECIDED',
  'ONCHAIN_PENDING',
  'RESOLVED',
  'CANCELLED'
);

-- CreateEnum
CREATE TYPE "app_service"."DisputeOutcome" AS ENUM (
  'RELEASE_TO_WORKER',
  'RETURN_TO_EMPLOYER',
  'SPLIT'
);

-- CreateEnum
CREATE TYPE "app_service"."DisputeEvidenceType" AS ENUM (
  'STATEMENT',
  'DELIVERY_PROOF',
  'COMMUNICATION_LOG',
  'SCREENSHOT',
  'INVOICE',
  'OTHER'
);

-- CreateEnum
CREATE TYPE "app_service"."DisputeAuditAction" AS ENUM (
  'DISPUTE_CREATED',
  'ESCROW_FREEZE_REQUESTED',
  'ESCROW_FREEZE_SUCCEEDED',
  'ESCROW_FREEZE_FAILED',
  'EVIDENCE_SUBMITTED',
  'REVIEW_NOTE_ADDED',
  'DECISION_RECORDED',
  'ONCHAIN_RESOLUTION_SUBMITTED',
  'ONCHAIN_RESOLUTION_CONFIRMED',
  'ONCHAIN_RESOLUTION_FAILED',
  'TIMEOUT_AUTO_RELEASE_TRIGGERED',
  'TIMEOUT_AUTO_RELEASE_CONFIRMED',
  'TIMEOUT_AUTO_RELEASE_FAILED'
);

-- CreateTable
CREATE TABLE "app_service"."disputes" (
  "id" SERIAL NOT NULL,
  "jobId" INTEGER NOT NULL,
  "openedByUserId" INTEGER NOT NULL,
  "status" "app_service"."DisputeStatus" NOT NULL DEFAULT 'OPEN',
  "freezeTxHash" TEXT,
  "resolutionTxHash" TEXT,
  "decision" "app_service"."DisputeOutcome",
  "decisionReason" TEXT,
  "adminReviewNote" TEXT,
  "decidedByAdminId" INTEGER,
  "openedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decidedAt" TIMESTAMPTZ(6),
  "resolvedAt" TIMESTAMPTZ(6),
  "cancelledAt" TIMESTAMPTZ(6),
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_service"."dispute_evidence" (
  "id" SERIAL NOT NULL,
  "disputeId" INTEGER NOT NULL,
  "submittedByUserId" INTEGER NOT NULL,
  "submittedByRole" "app_service"."UserRole" NOT NULL,
  "evidenceType" "app_service"."DisputeEvidenceType" NOT NULL DEFAULT 'STATEMENT',
  "contentText" TEXT NOT NULL,
  "attachmentUrl" TEXT,
  "externalRef" TEXT,
  "idempotencyKey" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "dispute_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_service"."dispute_decisions" (
  "id" SERIAL NOT NULL,
  "disputeId" INTEGER NOT NULL,
  "decidedByAdminId" INTEGER NOT NULL,
  "outcome" "app_service"."DisputeOutcome" NOT NULL,
  "workerShareBps" INTEGER,
  "rationale" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "dispute_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_service"."dispute_audit_logs" (
  "id" SERIAL NOT NULL,
  "disputeId" INTEGER NOT NULL,
  "actorUserId" INTEGER,
  "actorRole" "app_service"."UserRole",
  "actionType" "app_service"."DisputeAuditAction" NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "dispute_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "disputes_jobId_status_idx" ON "app_service"."disputes"("jobId", "status");

-- CreateIndex
CREATE INDEX "dispute_evidence_disputeId_createdAt_idx" ON "app_service"."dispute_evidence"("disputeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "dispute_decisions_disputeId_key" ON "app_service"."dispute_decisions"("disputeId");

-- CreateIndex
CREATE INDEX "dispute_audit_logs_disputeId_createdAt_idx" ON "app_service"."dispute_audit_logs"("disputeId", "createdAt");

-- Unique idempotency key per dispute (nullable)
CREATE UNIQUE INDEX "dispute_evidence_disputeId_idempotencyKey_key"
ON "app_service"."dispute_evidence"("disputeId", "idempotencyKey")
WHERE "idempotencyKey" IS NOT NULL;

-- Only one active dispute per job
CREATE UNIQUE INDEX "disputes_one_active_per_job_key"
ON "app_service"."disputes"("jobId")
WHERE "status" IN ('OPEN', 'EVIDENCE_SUBMISSION', 'UNDER_REVIEW', 'DECIDED', 'ONCHAIN_PENDING');

-- AddForeignKey
ALTER TABLE "app_service"."disputes" ADD CONSTRAINT "disputes_jobId_fkey"
FOREIGN KEY ("jobId") REFERENCES "app_service"."jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_service"."disputes" ADD CONSTRAINT "disputes_openedByUserId_fkey"
FOREIGN KEY ("openedByUserId") REFERENCES "app_service"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_service"."disputes" ADD CONSTRAINT "disputes_decidedByAdminId_fkey"
FOREIGN KEY ("decidedByAdminId") REFERENCES "app_service"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_service"."dispute_evidence" ADD CONSTRAINT "dispute_evidence_disputeId_fkey"
FOREIGN KEY ("disputeId") REFERENCES "app_service"."disputes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_service"."dispute_evidence" ADD CONSTRAINT "dispute_evidence_submittedByUserId_fkey"
FOREIGN KEY ("submittedByUserId") REFERENCES "app_service"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_service"."dispute_decisions" ADD CONSTRAINT "dispute_decisions_disputeId_fkey"
FOREIGN KEY ("disputeId") REFERENCES "app_service"."disputes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_service"."dispute_decisions" ADD CONSTRAINT "dispute_decisions_decidedByAdminId_fkey"
FOREIGN KEY ("decidedByAdminId") REFERENCES "app_service"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_service"."dispute_audit_logs" ADD CONSTRAINT "dispute_audit_logs_disputeId_fkey"
FOREIGN KEY ("disputeId") REFERENCES "app_service"."disputes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_service"."dispute_audit_logs" ADD CONSTRAINT "dispute_audit_logs_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "app_service"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
