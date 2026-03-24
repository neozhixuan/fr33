"use client";

import Button from "@/ui/Button";
import { UserInformation } from "../compliance-content";
import { IssueVCResponse } from "@/type/general";
import { processVcIssuance } from "@/lib/vcActions";
import { getWalletAddress } from "@/lib/aaActions";
import { convertBirthdateToAgeOver } from "@/utils/conv";
import { Spinner } from "@/ui/Spinner";
import { useState } from "react";

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
    <div>
      <p>Waiting for KYC</p>
      <Button onClick={handleGetInformation} disabled={isLoading}>
        {isLoading ? <Spinner /> : "Get Information and Issue VC"}
      </Button >

    </div>
  );
}
