/*
  Warnings:

  - Added the required column `onChainJobId` to the `jobs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "app_service"."jobs" ADD COLUMN     "onChainJobId" INTEGER NOT NULL,
ALTER COLUMN "escrowAddress" DROP NOT NULL;
