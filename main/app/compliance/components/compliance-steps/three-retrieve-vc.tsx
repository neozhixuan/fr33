"use client";

import Button from "@/ui/Button";
import { UserInformation } from "../compliance-content";
import { IssueVCResponse } from "@/types";
import { processVCIssuance, getWalletAddress } from "@/app/compliance/actions";

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
  // TODO: Rollback?
  const handleGetInformation = async () => {
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
      return;
    }

    // 2. Issue Verifiable Credential (VC) based on the user information
    const res = await fetch("http://localhost:3001/vc/issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectDid: `did:ethr:${walletAddress}`,
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
      return;
    }

    const data: IssueVCResponse = await res.json();

    if (!data.success) {
      alert(
        "VC issuance failed from compliance microservice: " + data.errorMsg
      );
      return;
    }

    // 3. Store VC metadata and update onboarding stage via server action
    try {
      await processVCIssuance(userId, data);
    } catch (error) {
      alert("Failed to complete VC issuance: " + (error as Error).message);
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
      <Button onClick={handleGetInformation}>
        Get Information and Issue VC
      </Button>
    </div>
  );
}

function convertBirthdateToAgeOver(birthdate: string, minAge: number): boolean {
  const birthDate = new Date(birthdate);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    return age - 1 >= minAge;
  }

  return age >= minAge;
}
