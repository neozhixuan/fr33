/*
  Warnings:

  - You are about to drop the column `accepTxHash` on the `jobs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "app_service"."jobs" DROP COLUMN "accepTxHash",
ADD COLUMN     "acceptTxHash" TEXT;
