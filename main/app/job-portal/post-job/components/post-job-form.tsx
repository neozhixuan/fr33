"use client";

import { Wallet } from "@/generated/prisma-client";
import { postingJobAction } from "@/lib/jobActions";
import { checkIsUserActionAllowed } from "@/lib/vcActions";
import { useActionState } from "react";

export function PostJobForm({ employerId, wallet }: { employerId: number; wallet: Wallet }) {
  const [postJobErrorMessage, postJobAction, isPostJobPending] = useActionState(
    async (prevState: string | undefined, formData: FormData) => {
      const isActionAllowed = await checkIsUserActionAllowed(wallet);
      if (!isActionAllowed) {
        alert("You are not compliant with the requirements to post a job. Please ensure you have the necessary credentials and try again.");
        return "You are not allowed to post a job.";
      }

      return postingJobAction(prevState, formData);
    },
    undefined
  );


  return (
    <form action={postJobAction} className="space-y-5">
      <div className="w-full space-y-5">
        {postJobErrorMessage && (
          <div
            role="alert"
            className="rounded border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300"
          >
            {postJobErrorMessage}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-[0.2em] text-[#b9cacb]" htmlFor="title">
            Job Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            placeholder="Senior smart contract auditor"
            required
            className="block w-full rounded-md border border-white/15 bg-[#131314] px-4 py-3 text-sm text-[#e5e2e3] outline-none transition-all placeholder:text-[#b9cacb]/40 focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff]/30"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-[0.2em] text-[#b9cacb]" htmlFor="description">
            Job Description
          </label>
          <textarea
            id="description"
            name="description"
            placeholder="Describe scope, deliverables, timeline, and acceptance criteria..."
            required
            rows={7}
            className="block w-full resize-y rounded-md border border-white/15 bg-[#131314] px-4 py-3 text-sm text-[#e5e2e3] outline-none transition-all placeholder:text-[#b9cacb]/40 focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff]/30"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-[0.2em] text-[#b9cacb]" htmlFor="payment">
            Payment Amount (SGD)
          </label>
          <input
            id="payment"
            name="payment"
            type="number"
            placeholder="500.00"
            required
            step={0.01}
            min={0}
            className="block w-full rounded-md border border-white/15 bg-[#131314] px-4 py-3 text-sm text-[#e5e2e3] outline-none transition-all placeholder:text-[#b9cacb]/40 focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff]/30"
          />
        </div>

        <input type="hidden" name="employerId" value={employerId} />

        <button
          type="submit"
          aria-disabled={isPostJobPending}
          disabled={isPostJobPending}
          className="w-full rounded-md bg-[#00f2ff] px-4 py-3.5 text-xs font-bold uppercase tracking-[0.25em] text-[#00363a] shadow-[0_0_20px_rgba(0,242,255,0.22)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPostJobPending ? "Publishing..." : "Post the Job"}
        </button>
      </div>
    </form>
  );
}
