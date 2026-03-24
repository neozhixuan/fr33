"use client";

import { useRouter } from "next/navigation";
import StepSkeleton from "./step-skeleton";

export function StartKYCCheckpoint() {
  const router = useRouter();

  return (
    <StepSkeleton
      stepName="Step 2 - Complete KYC"
      stepDescription="Verify your identity via Singpass. Once complete, you will return here to continue issuance."
    >
      <button
        type="button"
        onClick={() => router.push("/mock-singpass?callback=/compliance")}
        className="mt-6 rounded-md bg-[#00f2ff] px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#00363a] shadow-[0_0_18px_rgba(0,242,255,0.2)] transition-all hover:brightness-110"
      >
        Start KYC
      </button>
    </StepSkeleton >
  );
}
