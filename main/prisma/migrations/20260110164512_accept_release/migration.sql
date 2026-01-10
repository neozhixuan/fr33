-- AlterTable
ALTER TABLE "app_service"."jobs" ADD COLUMN     "approveReleaseAt" TIMESTAMP(3),
ADD COLUMN     "approveReleaseTxHash" TEXT;
