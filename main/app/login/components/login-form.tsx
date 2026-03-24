"use client";

import { useActionState } from "react";
import { authenticateAction } from "@/lib/authActions";
import { useSearchParams } from "next/navigation";
import { getLoginErrorMsg } from "@/utils/errors";
import NextLink from "next/link";

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
    <form action={loginAction} className="space-y-5">
      {authorisationErrorMessage && (
        <div role="alert" className="rounded border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">
          {authorisationErrorMessage}
        </div>
      )}
      <div className="w-full space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-[0.2em] text-[#b9cacb]" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="nexus@fr33.io"
            required
            className="block w-full rounded-md border border-white/15 bg-[#201f20] px-4 py-3 text-sm text-[#e5e2e3] outline-none transition-all placeholder:text-[#b9cacb]/40 focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff]/30"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-[0.2em] text-[#b9cacb]" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            className="block w-full rounded-md border border-white/15 bg-[#201f20] px-4 py-3 text-sm text-[#e5e2e3] outline-none transition-all placeholder:text-[#b9cacb]/40 focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff]/30"
          />
        </div>

        <input type="hidden" name="redirectTo" value={redirectURL} />

        <button
          type="submit"
          aria-disabled={isLoginPending}
          disabled={isLoginPending}
          className="w-full rounded-md bg-[#00f2ff] px-4 py-3.5 text-xs font-bold uppercase tracking-[0.25em] text-[#00363a] shadow-[0_0_20px_rgba(0,242,255,0.22)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoginPending ? "Authenticating..." : "Log In"}
        </button>

        {loginErrorMessage && (
          <div role="alert" className="rounded border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">
            {loginErrorMessage}
          </div>
        )}
      </div>
    </form>
  );
}
