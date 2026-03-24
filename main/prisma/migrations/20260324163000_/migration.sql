/*
  Warnings:

  - You are about to drop the `dispute_audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `dispute_decisions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "app_service"."dispute_audit_logs" DROP CONSTRAINT "dispute_audit_logs_actorUserId_fkey";

-- DropForeignKey
ALTER TABLE "app_service"."dispute_audit_logs" DROP CONSTRAINT "dispute_audit_logs_disputeId_fkey";

-- DropForeignKey
ALTER TABLE "app_service"."dispute_decisions" DROP CONSTRAINT "dispute_decisions_decidedByAdminId_fkey";

-- DropForeignKey
ALTER TABLE "app_service"."dispute_decisions" DROP CONSTRAINT "dispute_decisions_disputeId_fkey";

-- AlterTable
ALTER TABLE "app_service"."disputes" ADD COLUMN     "workerShareBps" INTEGER;

-- DropTable
DROP TABLE "app_service"."dispute_audit_logs";

-- DropTable
DROP TABLE "app_service"."dispute_decisions";
