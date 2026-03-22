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
import { logoutAction } from "@/lib/authActions";
import NextLink from "next/link";

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
    <div className="space-y-6">
      <section className="rounded-xl border border-[#00f2ff]/15 bg-[#1c1b1c]/80 p-6 shadow-[0_0_45px_rgba(0,242,255,0.06)] md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#00f2ff]">Compliance Sequence</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
              Complete identity and credential onboarding.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#b9cacb] md:text-base">
              This is an idempotent single-page flow: create wallet → complete KYC → issue VC → finish onboarding.
              Re-running completed steps is safe and will not break your account state.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NextLink
              href="/"
              className="rounded-md border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#e5e2e3] transition-colors hover:bg-white/10"
            >
              Home
            </NextLink>
            <button
              type="button"
              onClick={async () => await logoutAction("/")}
              className="rounded-md border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#e5e2e3] transition-colors hover:bg-white/10"
            >
              Logout
            </button>
          </div>
        </div>
      </section>

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
    </div>
  );
}
