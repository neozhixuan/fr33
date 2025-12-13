"use client";

import { completeKyc, createSmartAccountForUser } from "@/lib/authActions";
import { KycDataDTO } from "@/types";
import Button from "@/ui/Button";
import { redirect } from "next/navigation";
import { useState } from "react";

export default function MockKYCDetails({ userEmail }: { userEmail: string }) {
  const [isShowUserDetails, setIsShowUserDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userData: KycDataDTO = {
    fullName: "Jake",
    kycVerified: true,
    idType: "passport",
    idNumber: "A12345678",
    dob: "1990-01-01",
    kycTimestamp: new Date().toISOString(),
  };

  const createWalletWithKYCData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Step 1: Complete KYC verification
      await completeKyc(userEmail, userData);

      // Step 2: Create smart account wallet
      await createSmartAccountForUser(userEmail);

      // Step 3: Navigate to final step
      redirect("/register-step-three");
    } catch (err) {
      console.error("Failed to complete registration:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsShowUserDetails(true)} disabled={isLoading}>
        Mock KYC Check
      </Button>

      {isShowUserDetails && (
        <div>
          <p>Mock KYC Check Result:</p>
          <ul>
            <li>Name: {userData.fullName}</li>
            <li>KYC Verified: {userData.kycVerified ? "Yes" : "No"}</li>
            <li>ID Type: {userData.idType}</li>
            <li>ID Number: {userData.idNumber}</li>
            <li>Date of Birth: {userData.dob}</li>
            <li>KYC Timestamp: {userData.kycTimestamp}</li>
          </ul>
          <Button onClick={createWalletWithKYCData} disabled={isLoading}>
            {isLoading ? "Creating wallet..." : "Continue to step 3"}
          </Button>
        </div>
      )}

      {error && (
        <div className="text-red-500 p-4 border border-red-500 rounded">
          <p>Error: {error}</p>
        </div>
      )}
    </>
  );
}
