-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('WORKER', 'EMPLOYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "WalletStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "VCStatus" AS ENUM ('VALID', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('POSTED', 'FUNDED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'COMPLETED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "AuditResult" AS ENUM ('ALLOWED', 'BLOCKED');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'WORKER',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "did" TEXT NOT NULL,
    "status" "WalletStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vc_metadata" (
    "id" SERIAL NOT NULL,
    "walletId" INTEGER NOT NULL,
    "vcHash" TEXT NOT NULL,
    "issuedAt" TIMESTAMPTZ(6) NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "issuerDid" TEXT NOT NULL,
    "status" "VCStatus" NOT NULL DEFAULT 'VALID',

    CONSTRAINT "vc_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" SERIAL NOT NULL,
    "employerId" INTEGER NOT NULL,
    "workerWallet" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "escrowAddress" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'POSTED',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "walletAddress" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "result" "AuditResult" NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_address_key" ON "wallets"("address");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_did_key" ON "wallets"("did");

-- CreateIndex
CREATE UNIQUE INDEX "vc_metadata_walletId_key" ON "vc_metadata"("walletId");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vc_metadata" ADD CONSTRAINT "vc_metadata_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
