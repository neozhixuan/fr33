"use client";

import { completeKyc } from "@/lib/actions";
import Button from "@/ui/Button";
import { redirect } from "next/navigation";
import { useState } from "react";

export default function MockKYCDetails({ userEmail }: { userEmail: string }) {
    const [isShowUserDetails, setIsShowUserDetails] = useState(false);

    type mockUserData = {
        "name": string,
        "phone": string,
        "address": string,
        "date_of_birth": string,
        "id_type": string,
        "id_number": string,
    }
    const userData: mockUserData = {
        "name": "Jake",
        "phone": "1234567890",
        "address": "123 Main St",
        "date_of_birth": "1990-01-01",
        "id_type": "passport",
        "id_number": "A12345678",
    }

    const continueToStepThree = async () => {
        await completeKyc(userEmail); // Handle server action in actions.tsx
        redirect("register-step-three");
    }

    return (
        <>
            <Button onClick={() => setIsShowUserDetails(true)}>Mock KYC Check</Button>
            {isShowUserDetails && <div>
                <p>Mock KYC Check Result:</p>
                <ul>
                    <li>Name: {userData.name}</li>
                    <li>Phone: {userData.phone}</li>
                    <li>Address: {userData.address}</li>
                    <li>Date of Birth: {userData.date_of_birth}</li>
                    <li>ID Type: {userData.id_type}</li>
                    <li>ID Number: {userData.id_number}</li>
                </ul>
                <Button onClick={continueToStepThree}>Continue to step 3</Button>
            </div>}
        </>
    )
}