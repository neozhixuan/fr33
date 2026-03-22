"use client";

import { UserRole } from "@/generated/prisma-client";
import { registrationAction } from "@/lib/authActions";
import { useActionState } from "react";

export function RegistrationForm() {
  const [registrationErrorMessage, registerAction, isRegistrationPending] =
    useActionState(registrationAction, undefined);

  return (
    <form action={registerAction} className="space-y-5">
      {registrationErrorMessage && (
        <div role="alert" className="rounded border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">
          {registrationErrorMessage}
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

        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-[0.2em] text-[#b9cacb]" htmlFor="role">
            Role
          </label>

          <select
            className="block w-full rounded-md border border-white/15 bg-[#201f20] px-4 py-3 text-sm uppercase tracking-wide text-[#e5e2e3] outline-none transition-all focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff]/30"
            id="role"
            name="role"
            required
          >
            {Object.values(UserRole)
              .filter((role) => role !== UserRole.ADMIN)
              .map((role) => (
                <option key={role} value={role}>
                  {role.toLowerCase()}
                </option>
              ))}
          </select>
        </div>

        <button
          type="submit"
          aria-disabled={isRegistrationPending}
          disabled={isRegistrationPending}
          className="w-full rounded-md bg-[#00f2ff] px-4 py-3.5 text-xs font-bold uppercase tracking-[0.25em] text-[#00363a] shadow-[0_0_20px_rgba(0,242,255,0.22)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRegistrationPending ? "Creating account..." : "Create Account"}
        </button>
      </div>
    </form>
  );
}
