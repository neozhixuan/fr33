"use client";

import { useState, useEffect } from "react";
import {
  Checkpointer,
  StartKYC,
  WaitForKYC,
  CreateWallet,
  IssueVC,
  Finalising,
} from ".";
import { OnboardingStage } from "@prisma/client";
import { redirect, useSearchParams } from "next/navigation";
import { updateOnboardingStageAction } from "@/lib/authActions";
import Button from "@/ui/Button";

interface ComplianceContentProps {
  initialStage: OnboardingStage | null;
  userId: number;
}

export default function ComplianceContent({
  initialStage,
  userId,
}: ComplianceContentProps) {
  const [stage, setStage] = useState<OnboardingStage | null>(initialStage);

  const searchParams = useSearchParams();
  const authorizationCode = searchParams.get("code");
  const state = searchParams.get("state");

  // Automatically handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      if (stage === OnboardingStage.REGISTERED && authorizationCode && state) {
        // In a real app, we would send the authorization code to the backend to verify
        // For this mock, we directly move to the next stage
        const result = await updateOnboardingStageAction(
          userId,
          OnboardingStage.KYC_VERIFIED
        );
        if (result.success) {
          setStage(OnboardingStage.KYC_VERIFIED);
        } else {
          console.error("Failed to update onboarding stage:", result.error);
        }
      }
    };

    handleOAuthCallback();
  }, [stage, authorizationCode, state, userId]);

  return (
    <>
      <Checkpointer stage={stage} />
      {stage === "REGISTERED" && <StartKYC />}
      {stage === "KYC_PENDING" && <WaitForKYC />}
      {stage === "KYC_VERIFIED" && <CreateWallet />}
      {stage === "WALLET_CREATED" && <IssueVC />}
      {stage === "VC_ISSUED" && <Finalising />}
      <Button onClick={() => redirect("/")}>Return to home</Button>
    </>
  );
}
