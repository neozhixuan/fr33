"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

const AUTH_ERROR_CREDENTIAL_SIGNIN = "CredentialsSignin";

const AUTH_ERROR_MESSAGE_MAP: Record<string, string> = {
  AUTH_ERROR_CREDENTIAL_SIGNIN: "Invalid credentials.",
  Default: "Something went wrong.",
};

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  console.log("Check terminal logs");
  console.log(
    "Authenticating user with form data:",
    Object.fromEntries(formData.entries())
  );

  try {
    await signIn("credentials", formData, { redirectTo: "/job-portal" });

    console.log(
      "signIn completed without throwing an error. A redirect should have occurred."
    );
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case AUTH_ERROR_CREDENTIAL_SIGNIN:
          return AUTH_ERROR_MESSAGE_MAP[AUTH_ERROR_CREDENTIAL_SIGNIN];
        default:
          return AUTH_ERROR_MESSAGE_MAP["Default"];
      }
    }
    throw error;
  }
}
