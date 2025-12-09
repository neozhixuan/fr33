"use server";

import { signIn } from "@/server/auth";
import {
  createUserAfterPasswordHash,
  updateUserKYCInformation,
} from "@/model/user";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { KycDataDTO } from "@/types";

export async function authenticateAction(
  prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    // Return err message
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return "Invalid credentials, err: " + error.message;
      }

      return "Something went wrong, err: " + (error.message || "Unknown error");
    }
    // Non-auth error
    throw error;
  }
}

export async function registrationAction(
  prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  try {
    const email = formData.get("email")?.toString() ?? "";
    const password = formData.get("password")?.toString() ?? "";

    if (!email || !password) {
      return "Error: Please fill in all fields.";
    }

    await createUserAfterPasswordHash(email, password);
    redirect("/job-portal");
  } catch (error) {
    // Return err message
    if (error instanceof AuthError) {
      return "Something went wrong, err: " + (error.message || "Unknown error");
    }
    // Non-auth error
    throw error;
  }
}

export async function completeKyc(email: string, kycDataDTO: KycDataDTO) {
  try {
    await updateUserKYCInformation(email, kycDataDTO);
  } catch (error) {
    console.error("Failed to complete KYC, err: ", error);
    throw new Error("Failed to complete KYC, err: " + error);
  }
}
