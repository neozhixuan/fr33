"use server";

import { signIn, signOut } from "@/server/auth";
import {
  createUserAfterPasswordHash,
  updateUserOnboardingStage,
} from "@/model/user";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { OnboardingStage, UserRole } from "@/generated/prisma-client";
import { ExecutionResult } from "@/types";

/**
 * Server action to logout and redirect to specified path
 * @param redirectPath - path to redirect after logout
 */
export async function logoutAction(redirectPath: string) {
  await signOut({ redirectTo: redirectPath });
}

/**
 * Server action to logout and redirect to home
 */
export async function logoutToHomeAction() {
  await logoutAction("/");
}

/**
 * Server action to login user
 * @param prevState - TODO
 * @param formData - credentials
 * @returns errorMsg if any
 */
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

/**
 * Server action to register user
 * @param prevState - TODO
 * @param formData - credentials
 * @returns errorMsg if any
 */
export async function registrationAction(
  prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  try {
    const email = formData.get("email")?.toString() ?? "";
    const password = formData.get("password")?.toString() ?? "";
    const role = formData.get("role")?.toString() ?? "";

    if (!email || !password || !role) {
      return "Error: Please fill in all fields.";
    }

    await createUserAfterPasswordHash(email, password, role as UserRole);
    redirect("/login?error=new-user&from=job-portal");
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
 * @param userId - user's unique id
 * @param newStage - new onboarding stage
 * @returns success boolean and optional errorMsg
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
      errorMsg: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
