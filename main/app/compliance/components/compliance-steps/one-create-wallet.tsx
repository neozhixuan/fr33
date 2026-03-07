"use client";

import { createWallet } from "@/lib/aaActions";
import Button from "@/ui/Button";
import { Spinner } from "@/ui/Spinner";
import { useState } from "react";

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
    const res = await createWallet(userId);

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
    <>
      <h1>Create Wallet Component</h1>
      <Button onClick={initiateCreateWallet} disabled={isLoading}>
        {isLoading ? <Spinner /> : "Create Wallet"}
      </Button >
    </>
  );
}
