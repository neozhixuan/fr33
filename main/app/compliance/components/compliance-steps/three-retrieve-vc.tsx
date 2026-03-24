"use client";

import { UserInformation } from "../compliance-content";
import { IssueVCResponse } from "@/type/general";
import { processVcIssuance } from "@/lib/vcActions";
import { getWalletAddress } from "@/lib/aaActions";
import { convertBirthdateToAgeOver } from "@/utils/conv";
import { useState } from "react";
import StepSkeleton from "./step-skeleton";

export function RetrieveVCWithCredentialCheckpoint({
  authorizationCode,
  state,
  userId,
  onSuccess,
}: {
  authorizationCode: string | null;
  state: string | null;
  userId: number;
  onSuccess: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Rollback and improve
  const handleGetInformation = async () => {
    setIsLoading(true);

    if (!authorizationCode || !state) {
      alert("Missing authorization code or state");
      return;
    }

    // Mock fetching user information after KYC is approved
    // fetch("/api/mock-fetch-kyc", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ authorizationCode, state }),
    // })
    //   .then((res) => res.json())
    //   .then((data) => {
    //     console.log("Fetched KYC Information:", data);
    //   })
    //   .catch((err) => {
    //     console.error("Error fetching KYC information:", err);
    //   });

    // 1. Get user information from KYC provider
    const mockUserInfo: UserInformation = {
      iss: "https://singpass.gov.sg",
      aud: "FR33_CLIENT_ID",
      sub: "S1234567A",
      name: "TAN AH KOW",
      birthdate: "1999-01-01",
      iat: 1710000000,
      exp: 1710000600,
    };

    // Get wallet address from server action
    let walletAddress: string;
    try {
      walletAddress = await getWalletAddress(userId);
    } catch (error) {
      alert("Failed to fetch wallet: " + (error as Error).message);
      setIsLoading(false);
      return;
    }

    // 2. Issue Verifiable Credential (VC) based on the user information
    let data: IssueVCResponse;
    try {
      const res = await fetch("http://localhost:3001/vc/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectDid: `did:ethr:polygon:amoy:${walletAddress}`,
          kycData: {
            uinHash: mockUserInfo.sub,
            nameHash: mockUserInfo.name,
            birthdate: mockUserInfo.birthdate,
            ageOver: convertBirthdateToAgeOver(mockUserInfo.birthdate, 18),
            country: "SG",
            verifiedAt: new Date(mockUserInfo.iat * 1000).toISOString(),
          },
        }),
      });
      if (!res.ok) {
        alert("Failed to issue VC: " + (await res.text()));
        setIsLoading(false);
        return;
      }
      data = await res.json();
    } catch (error) {
      alert(
        "Failed to fetch from compliance microservice: " +
        (error as Error).message,
      );
      setIsLoading(false);
      return;
    }

    if (!data.success) {
      alert(
        "VC issuance failed from compliance microservice: " + data.errorMsg,
      );
      setIsLoading(false);
      return;
    }

    // 3. Store VC metadata and update onboarding stage via server action
    try {
      await processVcIssuance(userId, data);
    } catch (error) {
      alert("Failed to complete VC issuance: " + (error as Error).message);
      setIsLoading(false);
      return;
    }

    // Use the vcJwt and expiresAt as needed
    console.log("JWT:", data.vc);
    console.log("Expires At:", data.expiresAt);

    onSuccess();
  };

  return (
    <StepSkeleton
      stepName="Step 3 - Retrieve info + issue VC"
      stepDescription="After successful KYC, retrieve verified identity attributes and issue your verifiable credential."
    >
      <button
        type="button"
        onClick={handleGetInformation}
        disabled={isLoading}
        className="mt-6 rounded-md bg-[#00f2ff] px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#00363a] shadow-[0_0_18px_rgba(0,242,255,0.2)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Issuing VC..." : "Get Information and Issue VC"}
      </button>
    </StepSkeleton>
  );
}
