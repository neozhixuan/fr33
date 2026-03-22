"use client";

import { useEffect, useState } from "react";
import { getWalletAddress } from "@/lib/aaActions";
import StepSkeleton from "./step-skeleton";

export function FinalCheckpoint({
  userId,
  onSuccess,
}: {
  userId: number;
  onSuccess: () => void;
}) {
  const [walletAddress, setWalletAddress] = useState<string>("");

  useEffect(() => {
    const fetchWalletAddress = async () => {
      const walletAddress = await getWalletAddress(userId);
      setWalletAddress(walletAddress);
    };
    fetchWalletAddress();
  }, [userId]);

  return (
    <StepSkeleton
      stepName="Step 4 - Completed"
      stepDescription="Congratulations, you have completed the compliance sequence."
    >
      <p className="mt-2 break-all text-sm text-[#d6ffe0]">
        Wallet address: {walletAddress || "Loading..."}
      </p>
      <button
        type="button"
        onClick={onSuccess}
        className="mt-6 rounded-md bg-[#00f2ff] px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#00363a] shadow-[0_0_18px_rgba(0,242,255,0.2)] transition-all hover:brightness-110"
      >
        Proceed to Dashboard
      </button>
    </StepSkeleton>
  );
}
