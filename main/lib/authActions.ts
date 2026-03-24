"use server";
// NOTE: Actions should not throw errors; return error messages instead.
import { signIn, signOut } from "@/server/auth";
import {
  createUserAfterPasswordHash,
  getUserAuthorisationStatus,
  updateUserOnboardingStage,
} from "@/model/user";
import { AuthError, User } from "next-auth";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { ExecutionResult } from "@/type/general";
import {
  OnboardingStage,
  UserRole,
  User as DBUser,
  Wallet,
} from "@/generated/prisma-client";
import { stringToInt } from "@/utils/conv";
import { ERROR_TYPE_MAP, getFallbackURL } from "@/utils/errors";

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
  formData: FormData,
): Promise<string | undefined> {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (isRedirectError(error)) {
      return "Redirect error: " + error.message;
    }

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
    return (
      "Unknown error: " + (error as Error).message ||
      "Unknown error, please try again"
    );
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
  formData: FormData,
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
    if (isRedirectError(error)) {
      return "Redirect error: " + error.message;
    }

    // Return err message
    if (error instanceof AuthError) {
      return "Something went wrong, err: " + (error.message || "Unknown error");
    }
    // Non-auth error
    return (error as Error).message || "Unknown error, please try again";
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
  newStage: OnboardingStage,
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

/**
 * Redirects unauthorised users to the appropriate fallback URL.
 * Server component (runs on Node runtime) - Block SSR if auth doesn't pass
 */
export async function ensureAuthorisedAndCompliantUser(
  sessionUser: User,
): Promise<{ user: DBUser; wallet: Wallet | undefined }> {
  if (!sessionUser.id) {
    throw new Error(
      "User ID is missing in session: " + JSON.stringify(sessionUser),
    );
  }
  const userId = stringToInt(sessionUser.id as string);
  const { user, wallet, isCompliant } = await getUserAuthorisationStatus(
    userId,
  );
  if (!user) {
    // Session user is no longer valid
    const target = getFallbackURL("job-portal", ERROR_TYPE_MAP.UNAUTHORISED);
    // Redirect to a Route Handler that clears cookies then redirects
    redirect(`/api/logout?redirectTo=${encodeURIComponent(target)}`);
  }

  if (!isCompliant) {
    // Session user needs to complete compliance
    redirect("/compliance");
  }

  return { user, wallet };
}
