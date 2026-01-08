"use client";

import { useState, useEffect } from "react";
import {
  Checkpointer,
  StartKYCCheckpoint,
  CreateWalletCheckpoint,
  FinalCheckpoint,
  RetrieveVCWithCredentialCheckpoint,
} from ".";
import { OnboardingStage } from "@/generated/prisma-client";
import { redirect, useSearchParams } from "next/navigation";
import Button from "@/ui/Button";
import { signOut } from "@/server/auth";
import { logoutAction } from "@/lib/authActions";

interface ComplianceContentProps {
  initialStage: OnboardingStage | null;
  userId: number;
}

export type UserInformation = {
  iss: string;
  aud: string;
  sub: string;
  name: string;
  birthdate: string;
  iat: number;
  exp: number;
};

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
      // Move to KYC_PENDING stage if we have the code and state from OAuth
      if (stage === OnboardingStage.KYC_PENDING && authorizationCode && state) {
        setStage(OnboardingStage.VC_PENDING);
      }
    };

    handleOAuthCallback();
  }, [stage, authorizationCode, state, userId]);

  return (
    <>
      <Checkpointer stage={stage} />

      {stage === OnboardingStage.WALLET_PENDING && (
        <CreateWalletCheckpoint
          userId={userId}
          onSuccess={() => setStage(OnboardingStage.KYC_PENDING)}
        />
      )}

      {stage === OnboardingStage.KYC_PENDING && <StartKYCCheckpoint />}

      {stage === OnboardingStage.VC_PENDING && (
        <RetrieveVCWithCredentialCheckpoint
          userId={userId}
          authorizationCode={authorizationCode}
          state={state}
          onSuccess={() => setStage(OnboardingStage.COMPLETED)}
        />
      )}

      {stage === OnboardingStage.COMPLETED && (
        <FinalCheckpoint
          userId={userId}
          onSuccess={() => redirect("/job-portal")}
        />
      )}

      <Button onClick={() => redirect("/")}>Return to home</Button>

      <Button onClick={logoutAction}>Logout</Button>
    </>
  );
}
