"use client";

import { useRouter, useSearchParams } from "next/navigation";
import NextLink from "next/link";

export function SingpassContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callback") || "/compliance";

  const handleAgree = () => {
    router.push(`${callbackURL}?code=AUTHORIZATION_CODE&state=xyz`);
  };

  const handleCancel = () => {
    router.push(`${callbackURL}?error=access_denied&from=mock-singpass`);
  };

  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-[#d1d5db] bg-white shadow-sm">
      <header className="border-b border-[#e5e7eb] bg-[#be1e2d] px-6 py-5 text-white md:px-8">
        <p className="text-xs uppercase tracking-[0.18em] text-white/80">Mock Authentication Gateway</p>
        <h1 className="mt-1 text-2xl font-bold">Singpass</h1>
      </header>

      <section className="space-y-6 px-6 py-7 md:px-8 md:py-8">
        <div>
          <h2 className="text-xl font-semibold text-[#111827]">Consent to share your profile information</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#4b5563]">
            <span className="font-semibold text-[#111827]">fr33</span> is requesting access to the following information for identity verification.
          </p>
        </div>

        <div className="rounded-xl border border-[#d1d5db] bg-[#f9fafb] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b7280]">Data requested</p>
          <ul className="mt-3 space-y-2 text-sm text-[#1f2937]">
            <li className="flex items-start justify-between gap-4 border-b border-[#e5e7eb] pb-2">
              <span>Full Name</span>
              <span className="font-medium">John Doe</span>
            </li>
            <li className="flex items-start justify-between gap-4 border-b border-[#e5e7eb] pb-2">
              <span>NRIC / FIN (hashed)</span>
              <span className="font-medium">S1234567A</span>
            </li>
            <li className="flex items-start justify-between gap-4">
              <span>Date of Birth</span>
              <span className="font-medium">1999-01-01</span>
            </li>
          </ul>
        </div>

        <div className="rounded-lg border border-[#fde68a] bg-[#fffbeb] p-4 text-xs leading-relaxed text-[#92400e]">
          This is a mock Singpass experience for local development only. Do not use real credentials.
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md border border-[#9ca3af] px-5 py-2.5 text-sm font-semibold text-[#374151] transition-colors hover:bg-[#f3f4f6]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAgree}
            className="rounded-md bg-[#be1e2d] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#a21927]"
          >
            Agree and Continue
          </button>
        </div>

        <div className="pt-2 text-xs text-[#6b7280]">
          Need help? Return to{" "}
          <NextLink href="/compliance" className="font-semibold text-[#be1e2d] hover:underline">
            compliance
          </NextLink>
          .
        </div>
      </section>
    </div>
  );
}
