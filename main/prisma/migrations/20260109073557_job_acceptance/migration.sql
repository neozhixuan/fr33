-- AlterTable
ALTER TABLE "app_service"."jobs" ADD COLUMN     "accepTxHash" TEXT,
ADD COLUMN     "acceptedAt" TIMESTAMP(3);
