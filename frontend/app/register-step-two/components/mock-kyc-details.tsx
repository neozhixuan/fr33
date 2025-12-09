"use client";

import { completeKyc } from "@/lib/actions";
import { KycDataDTO } from "@/types";
import Button from "@/ui/Button";
import { redirect } from "next/navigation";
import { useState } from "react";

export default function MockKYCDetails({ userEmail }: { userEmail: string }) {
  const [isShowUserDetails, setIsShowUserDetails] = useState(false);

  const userData: KycDataDTO = {
    fullName: "Jake",
    kycVerified: true,
    idType: "passport",
    idNumber: "A12345678",
    dob: "1990-01-01",
    kycTimestamp: new Date().toISOString(),
  };

  const continueToStepThree = async () => {
    await completeKyc(userEmail, userData); // Handle server action in actions.tsx
    redirect("register-step-three");
  };

  return (
    <>
      <Button onClick={() => setIsShowUserDetails(true)}>Mock KYC Check</Button>
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
          <Button onClick={continueToStepThree}>Continue to step 3</Button>
        </div>
      )}
    </>
  );
}
