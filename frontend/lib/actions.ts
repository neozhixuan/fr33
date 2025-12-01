"use server";

import { signIn } from "@/server/auth";
import {
  createUserAfterPasswordHash,
  updateUserRegistrationStep,
} from "@/model/user";
import { AuthError } from "next-auth";

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
    const name = formData.get("name")?.toString() ?? "";

    if (!email || !password || !name) {
      return "Error: Please fill in all fields.";
    }

    await createUserAfterPasswordHash(name, email, password);
  } catch (error) {
    // Return err message
    if (error instanceof AuthError) {
      return "Something went wrong, err: " + (error.message || "Unknown error");
    }
    // Non-auth error
    throw error;
  }
}

export async function completeKyc(email: string) {
  await updateUserRegistrationStep(email, 2);
}
