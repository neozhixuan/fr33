-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "compliance_service";

-- CreateEnum
CREATE TYPE "VCStatus" AS ENUM ('VALID', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "compliance_service"."EscrowEventType" AS ENUM ('JOB_CREATED', 'JOB_ACCEPTED', 'RELEASE_REQUESTED', 'FUNDS_RELEASED', 'JOB_CANCELLED');

-- CreateEnum
CREATE TYPE "compliance_service"."ComplianceRuleName" AS ENUM ('LARGE_ESCROW_ANOMALY', 'HIGH_DISPUTE_FREQUENCY', 'BURST_ACTIVITY');

-- CreateEnum
CREATE TYPE "compliance_service"."ComplianceCaseStatus" AS ENUM ('OPEN', 'DISMISSED', 'ACTIONED');

-- CreateTable
CREATE TABLE "IssuedVC" (
    "id" SERIAL NOT NULL,
    "vcHash" TEXT NOT NULL,
    "subjectDid" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "VCStatus" NOT NULL DEFAULT 'VALID',

    CONSTRAINT "IssuedVC_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_service"."escrow_activity" (
    "id" SERIAL NOT NULL,
    "sourceEventId" TEXT NOT NULL,
    "jobId" BIGINT NOT NULL,
    "eventType" "compliance_service"."EscrowEventType" NOT NULL,
    "walletAddress" TEXT,
    "counterpartyAddress" TEXT,
    "amountWei" TEXT,
    "blockNumber" BIGINT NOT NULL,
    "blockTimestamp" TIMESTAMPTZ(6) NOT NULL,
    "txHash" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "escrow_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_service"."compliance_ingestion_cursor" (
    "id" INTEGER NOT NULL,
    "lastProcessedTimestamp" TIMESTAMPTZ(6),
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "compliance_ingestion_cursor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_service"."compliance_profiles" (
    "id" SERIAL NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "cumulativeScore" INTEGER NOT NULL DEFAULT 0,
    "lastTriggeredAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "compliance_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_service"."compliance_rule_triggers" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "ruleName" "compliance_service"."ComplianceRuleName" NOT NULL,
    "scoreDelta" INTEGER NOT NULL,
    "threshold" JSONB NOT NULL,
    "observed" JSONB NOT NULL,
    "sourceEventId" TEXT,
    "sourceTxHash" TEXT,
    "fingerprint" TEXT NOT NULL,
    "caseId" INTEGER,
    "triggeredAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_rule_triggers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_service"."compliance_cases" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "status" "compliance_service"."ComplianceCaseStatus" NOT NULL DEFAULT 'OPEN',
    "scoreAtCreation" INTEGER NOT NULL,
    "triggeredRules" TEXT[],
    "evidence" JSONB NOT NULL,
    "actionNotes" TEXT,
    "actionTxHash" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "closedAt" TIMESTAMPTZ(6),

    CONSTRAINT "compliance_cases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IssuedVC_vcHash_key" ON "IssuedVC"("vcHash");

-- CreateIndex
CREATE UNIQUE INDEX "escrow_activity_sourceEventId_key" ON "compliance_service"."escrow_activity"("sourceEventId");

-- CreateIndex
CREATE INDEX "escrow_activity_walletAddress_blockTimestamp_idx" ON "compliance_service"."escrow_activity"("walletAddress", "blockTimestamp");

-- CreateIndex
CREATE INDEX "escrow_activity_eventType_blockTimestamp_idx" ON "compliance_service"."escrow_activity"("eventType", "blockTimestamp");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_profiles_walletAddress_key" ON "compliance_service"."compliance_profiles"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_rule_triggers_fingerprint_key" ON "compliance_service"."compliance_rule_triggers"("fingerprint");

-- CreateIndex
CREATE INDEX "compliance_rule_triggers_profileId_triggeredAt_idx" ON "compliance_service"."compliance_rule_triggers"("profileId", "triggeredAt");

-- CreateIndex
CREATE INDEX "compliance_cases_status_createdAt_idx" ON "compliance_service"."compliance_cases"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "compliance_service"."compliance_rule_triggers" ADD CONSTRAINT "compliance_rule_triggers_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "compliance_service"."compliance_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_service"."compliance_rule_triggers" ADD CONSTRAINT "compliance_rule_triggers_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "compliance_service"."compliance_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_service"."compliance_cases" ADD CONSTRAINT "compliance_cases_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "compliance_service"."compliance_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
