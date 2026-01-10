-- AlterTable
ALTER TABLE "app_service"."jobs" ADD COLUMN     "applyReleaseAt" TIMESTAMP(3),
ADD COLUMN     "applyReleaseTxHash" TEXT;
