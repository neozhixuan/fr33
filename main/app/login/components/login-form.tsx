"use client";

import { useActionState } from "react";
import { authenticateAction } from "@/lib/authActions";
import Button from "@/ui/Button";
import { useSearchParams } from "next/navigation";
import { getLoginErrorMsg } from "@/utils/errors";
import FormInput from "@/ui/FormInput";

export function LoginForm() {
  const redirectURL = "/job-portal";

  const searchParams = useSearchParams();
  const authorisationError = searchParams.get("error");
  const from = searchParams.get("from");
  const authorisationErrorMessage: string = authorisationError
    ? getLoginErrorMsg(from!, authorisationError)
    : ""; // Note: Accessing a missing key returns undefined

  const [loginErrorMessage, loginAction, isLoginPending] = useActionState(
    authenticateAction,
    undefined
  ); // Pass in an action and an initial state -> Creates a component state tuple with three elements: the current state, a function to update the state, and a boolean indicating if the action is pending.

  return (
    <form action={loginAction} className="space-y-3 position-relative w-1/3">
      {authorisationErrorMessage && (
        <div
          role="alert"
          className="text-red-500 text-sm position-absolute top-0 left-0 w-full"
        >
          {authorisationErrorMessage}
        </div>
      )}
      <div className="w-full flex flex-col gap-5">
        <FormInput
          id="email"
          type="email"
          placeholder="Enter your email address"
          label="Email"
          required
        />
        <FormInput
          id="password"
          type="password"
          placeholder="Enter your password"
          label="Password"
          required
        />

        <div
          className="flex justify-center h-8 items-end space-x-1"
          aria-live="polite"
          aria-atomic="true"
        >
          {/* Hidden input to pass redirectTo to server action */}
          <input type="hidden" name="redirectTo" value={redirectURL} />
          <Button
            type="submit"
            aria-disabled={isLoginPending}
            disabled={isLoginPending}
          >
            Log in
          </Button>
        </div>

        {loginErrorMessage && (
          <>
            <p>{loginErrorMessage}</p>
          </>
        )}
      </div>
    </form>
  );
}
