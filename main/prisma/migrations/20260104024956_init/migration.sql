-- CreateEnum
CREATE TYPE "app_service"."UserRole" AS ENUM ('WORKER', 'EMPLOYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "app_service"."OnboardingStage" AS ENUM ('WALLET_PENDING', 'KYC_PENDING', 'VC_PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "app_service"."WalletStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "app_service"."VCStatus" AS ENUM ('VALID', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "app_service"."JobStatus" AS ENUM ('POSTED', 'FUNDED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'COMPLETED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "app_service"."AuditResult" AS ENUM ('ALLOWED', 'BLOCKED');

-- CreateTable
CREATE TABLE "app_service"."users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "app_service"."UserRole" NOT NULL DEFAULT 'WORKER',
    "onboardingStage" "app_service"."OnboardingStage" NOT NULL DEFAULT 'WALLET_PENDING',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_service"."wallets" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "did" TEXT NOT NULL,
    "encryptedSignerKey" TEXT NOT NULL,
    "signerKeyIv" TEXT NOT NULL,
    "status" "app_service"."WalletStatus" NOT NULL DEFAULT 'ACTIVE',
    "suspensionReason" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_service"."vc_metadata" (
    "id" SERIAL NOT NULL,
    "walletId" INTEGER NOT NULL,
    "vcHash" TEXT NOT NULL,
    "issuedAt" TIMESTAMPTZ(6) NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "issuerDid" TEXT NOT NULL,
    "status" "app_service"."VCStatus" NOT NULL DEFAULT 'VALID',

    CONSTRAINT "vc_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_service"."jobs" (
    "id" SERIAL NOT NULL,
    "employerId" INTEGER NOT NULL,
    "workerWallet" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "escrowAddress" TEXT NOT NULL,
    "status" "app_service"."JobStatus" NOT NULL DEFAULT 'POSTED',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_service"."audit_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "walletAddress" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "result" "app_service"."AuditResult" NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "app_service"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_address_key" ON "app_service"."wallets"("address");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_did_key" ON "app_service"."wallets"("did");

-- CreateIndex
CREATE UNIQUE INDEX "vc_metadata_walletId_key" ON "app_service"."vc_metadata"("walletId");

-- AddForeignKey
ALTER TABLE "app_service"."wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_service"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_service"."vc_metadata" ADD CONSTRAINT "vc_metadata_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "app_service"."wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_service"."audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_service"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
