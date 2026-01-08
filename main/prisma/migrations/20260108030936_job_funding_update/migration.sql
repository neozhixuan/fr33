/*
  Warnings:

  - You are about to drop the column `escrowAddress` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `onChainJobId` on the `jobs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "app_service"."jobs" DROP COLUMN "escrowAddress",
DROP COLUMN "onChainJobId",
ADD COLUMN     "fundedAt" TIMESTAMP(3),
ADD COLUMN     "fundedTxHash" TEXT;
