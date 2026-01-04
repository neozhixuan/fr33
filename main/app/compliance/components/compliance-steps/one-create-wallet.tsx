"use client";

import { createWallet } from "@/lib/aaActions";
import Button from "@/ui/Button";

export function CreateWalletCheckpoint({
  userId,
  onSuccess,
}: {
  userId: number;
  onSuccess: () => void;
}) {
  // Start the sequence that creates the wallet and updates the database
  const initiateCreateWallet = async () => {
    const res = await createWallet(userId);

    if (!res.success) {
      console.error("Failed to create wallet:", res.errorMsg);
      alert("Failed to create wallet: " + res.errorMsg);
      return;
    }

    console.log("Wallet created successfully");
    onSuccess();
  };

  return (
    <>
      <h1>Create Wallet Component</h1>
      <Button onClick={initiateCreateWallet}>Create Wallet</Button>
    </>
  );
}
