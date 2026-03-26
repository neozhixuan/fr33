"use client";

import { createWallet } from "@/lib/aaActions";
import { createEmbeddedWalletForUser } from "@/lib/embeddedWalletClient";
import { useState } from "react";
import StepSkeleton from "./step-skeleton";

export function CreateWalletCheckpoint({
  userId,
  onSuccess,
}: {
  userId: number;
  onSuccess: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  // Start the sequence that creates the wallet and updates the database
  const initiateCreateWallet = async () => {
    setIsLoading(true);
    const { address } = await createEmbeddedWalletForUser(userId);
    const res = await createWallet(userId, address);

    if (!res.success) {
      console.error("Failed to create wallet:", res.errorMsg);
      alert("Failed to create wallet: " + res.errorMsg);
      setIsLoading(false);
      return;
    }

    console.log("Wallet created successfully");
    onSuccess();
  };

  return (
    <StepSkeleton
      stepName="Step 1 - Create Wallet"
      stepDescription="Generate your smart-account wallet. This can be retried safely if interrupted."
    >
      <button
        type="button"
        onClick={initiateCreateWallet}
        disabled={isLoading}
        className="mt-6 rounded-md bg-[#00f2ff] px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#00363a] shadow-[0_0_18px_rgba(0,242,255,0.2)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Creating wallet..." : "Create Wallet"}
      </button>
    </StepSkeleton>
  );
}
