-- CreateEnum
CREATE TYPE "OnboardingStage" AS ENUM ('REGISTERED', 'KYC_PENDING', 'KYC_VERIFIED', 'WALLET_CREATED', 'VC_ISSUED', 'COMPLETED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "onboardingStage" "OnboardingStage" NOT NULL DEFAULT 'REGISTERED';
