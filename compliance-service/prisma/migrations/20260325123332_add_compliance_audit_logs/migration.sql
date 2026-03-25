-- CreateEnum
CREATE TYPE "compliance_service"."ComplianceAuditAction" AS ENUM ('CASE_DISMISSED', 'CASE_ACTIONED', 'VC_REVOKED');

-- CreateEnum
CREATE TYPE "compliance_service"."ComplianceAuditResult" AS ENUM ('ALLOWED', 'BLOCKED', 'FAILED');

-- CreateTable
CREATE TABLE "compliance_service"."compliance_audit_logs" (
    "id" SERIAL NOT NULL,
    "actorUserId" INTEGER,
    "actorEmail" TEXT,
    "action" "compliance_service"."ComplianceAuditAction" NOT NULL,
    "result" "compliance_service"."ComplianceAuditResult" NOT NULL DEFAULT 'ALLOWED',
    "caseId" INTEGER,
    "walletAddress" TEXT,
    "vcHash" TEXT,
    "txHash" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "compliance_audit_logs_createdAt_idx" ON "compliance_service"."compliance_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "compliance_audit_logs_action_createdAt_idx" ON "compliance_service"."compliance_audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "compliance_audit_logs_walletAddress_createdAt_idx" ON "compliance_service"."compliance_audit_logs"("walletAddress", "createdAt");

-- CreateIndex
CREATE INDEX "compliance_audit_logs_vcHash_createdAt_idx" ON "compliance_service"."compliance_audit_logs"("vcHash", "createdAt");
