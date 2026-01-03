"use server";

import { signIn } from "@/server/auth";
import {
  createUserAfterPasswordHash,
  updateUserOnboardingStage,
} from "@/model/user";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { OnboardingStage } from "@prisma/client";

export type SmartAccountDetails = {
  smartAccountAddress: string;
  encryptedWithIv: string;
};

export type ExecutionResult = {
  success: boolean;
  error?: string;
};

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

      return (
        "Something went wrong in login authentication, err: " +
        (error.message || "Unknown error")
      );
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

/**
 * Server action to update user's onboarding stage
 * Can be called from client components
 */
export async function updateOnboardingStageAction(
  userId: number,
  newStage: OnboardingStage
): Promise<ExecutionResult> {
  try {
    await updateUserOnboardingStage(userId, newStage);
    return { success: true };
  } catch (error) {
    console.error("Failed to update onboarding stage:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
