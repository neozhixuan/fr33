-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "issuer_service";

-- CreateEnum
CREATE TYPE "issuer_service"."VCStatus" AS ENUM ('VALID', 'REVOKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "issuer_service"."IssuedVC" (
    "id" SERIAL NOT NULL,
    "vcHash" TEXT NOT NULL,
    "subjectDid" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "issuer_service"."VCStatus" NOT NULL DEFAULT 'VALID',

    CONSTRAINT "IssuedVC_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IssuedVC_vcHash_key" ON "issuer_service"."IssuedVC"("vcHash");
