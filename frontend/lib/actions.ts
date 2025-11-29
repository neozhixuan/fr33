"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function authenticateAction(
  prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  console.log(
    "[authenticateAction] Authenticating user with form data:",
    Object.fromEntries(formData.entries())
  );

  try {
    await signIn("credentials", formData);

    console.log(
      "[authenticateAction] signIn completed without throwing an error. A redirect should have occurred."
    );
  } catch (error) {
    // Return err message
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        console.log(
          "[authenticateAction] CredentialsSignin error:",
          error.message
        );
        return "Invalid credentials, err: " + error.message;
      }

      console.error("[authenticateAction] Caught unexpected error:", error);
      return "Something went wrong, err: " + (error.message || "Unknown error");
    }
    // Non-auth error
    throw error;
  }
}
