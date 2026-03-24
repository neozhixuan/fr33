"use client";

import { JobStatus } from "@/generated/prisma-client";
import { JobListingsResult } from "@/type/general";
import { POL_TO_SGD_RATE } from "@/utils/constants";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function JobListings({
  jobs,
  page,
  userId,
  walletAddress,
  view,
  walletPolBalanceLabel,
}: {
  jobs: JobListingsResult;
  page: number;
  userId: number;
  walletAddress: string;
  view: "all" | "my-gigs";
  walletPolBalanceLabel: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "budget-high">("newest");

  const handleJobOnClick = (jobId: string) => {
    router.push(`/job-portal/${jobId}`);
  };

  // Filter jobs based on (1) view (all vs my gigs), (2) search query
  // Then, sort them based on selected criteria
  const filteredAndSortedJobs = useMemo(() => { // Memoise to optimise performance
    const normalizedWallet = walletAddress.toLowerCase();
    const normalizedQuery = query.trim().toLowerCase();

    let list = jobs.items.filter((job) => {
      if (view !== "my-gigs") {
        return true;
      }

      const isEmployerJob = job.employerId === userId;
      const isWorkerJob =
        Boolean(job.workerWallet) &&
        job.workerWallet?.toLowerCase() === normalizedWallet;

      return isEmployerJob || isWorkerJob;
    });

    if (normalizedQuery) {
      list = list.filter((job) => {
        const haystack = `${job.title} ${job.description}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      });
    }

    const sorted = [...list].sort((a, b) => {
      // Budget sort
      if (sortBy === "budget-high") {
        return b.amount - a.amount;
      }

      // Time sort (newest first)
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    return sorted;
  }, [jobs.items, query, sortBy, userId, view, walletAddress]);

  const getStatusConfig = (status: JobStatus) => {
    if (status === JobStatus.POSTED) {
      return {
        label: "OPEN",
        tagClass:
          "border-[#7cf39e]/30 bg-[#7cf39e]/10 text-[#7cf39e]",
        accentClass: "border-l-[#00f2ff]",
      };
    }
    if (status === JobStatus.IN_PROGRESS) {
      return {
        label: "IN PROGRESS",
        tagClass:
          "border-[#dcb8ff]/30 bg-[#dcb8ff]/10 text-[#dcb8ff]",
        accentClass: "border-l-[#7701d0]",
      };
    }
    if (status === JobStatus.FUNDED) {
      return {
        label: "FUNDED",
        tagClass:
          "border-[#7cf39e]/30 bg-[#7cf39e]/10 text-[#7cf39e]",
        accentClass: "border-l-[#7cf39e]",
      };
    }
    return {
      label: status.replaceAll("_", " "),
      tagClass: "border-white/30 bg-white/10 text-[#e5e2e3]",
      accentClass: "border-l-white/30",
    };
  };

  return (
    <section className="space-y-5">
      <section className="relative overflow-hidden rounded-xl border border-[#00f2ff]/15 bg-[#1c1b1c]/70 p-6 shadow-[0_0_50px_rgba(0,242,255,0.05)] md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#00f2ff]/10 blur-[120px]" />
        <div className="relative z-10 space-y-5">
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">
            {view === "my-gigs" ? (
              <>
                Your <span className="text-[#00f2ff]">gigs</span>
              </>
            ) : (
              <>
                Find your next <span className="text-[#00f2ff]">high-paying task.</span>
              </>
            )}
          </h1>
          <div className="flex flex-col gap-3 rounded-xl border border-[#00f2ff]/20 bg-[#201f20]/80 p-3 md:flex-row md:items-center">
            <div className="flex flex-1 items-center gap-3 px-3">
              <span className="text-[#00f2ff]">⌕</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for 'smart contract audit', 'frontend developer'..."
                className="w-full bg-transparent text-sm text-[#b9cacb] outline-none placeholder:text-[#b9cacb]/60"
              />
            </div>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-lg border border-white/20 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#e5e2e3]"
            >
              Clear
            </button>
          </div>
        </div>
      </section>

      <div className="rounded-xl border border-[#00f2ff]/15 bg-[#201f20] p-6">
        <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-[#b9cacb]">Wallet Balance (POL)</p>
        <p className="text-2xl font-black text-[#e5e2e3]">{walletPolBalanceLabel}</p>
      </div>

      {filteredAndSortedJobs.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-[#1c1b1c] p-10 text-center text-[#b9cacb]">
          No job listings available.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#b9cacb]">
              Showing <span className="font-bold text-[#00f2ff]">{filteredAndSortedJobs.length}</span> jobs for you
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#b9cacb]">Sort by:</span>
              <select
                className="rounded-md border border-white/15 bg-[#201f20] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#00f2ff]"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value === "budget-high" ? "budget-high" : "newest"
                  )
                }
              >
                <option value="newest">Newest</option>
                <option value="budget-high">Budget: High to Low</option>
              </select>
            </div>
          </div>

          {filteredAndSortedJobs.map((job) => {
            const statusConfig = getStatusConfig(job.status);
            return (
              <article
                key={job.id}
                className={`group relative cursor-pointer rounded-xl border border-[#00f2ff]/15 bg-[#201f20]/70 p-6 transition-all hover:shadow-[0_0_30px_rgba(0,242,255,0.08)] md:p-8 border-l-4 ${statusConfig.accentClass}`}
                onClick={() => handleJobOnClick(job.id.toString())}
              >
                <div className="absolute right-6 top-6">
                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${statusConfig.tagClass}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>

                <h2 className="pr-28 text-xl font-black text-[#e5e2e3] transition-colors group-hover:text-[#00f2ff] md:text-2xl">
                  {job.title}
                </h2>

                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#b9cacb]">
                  {job.description}
                </p>

                <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-5">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#b9cacb]">Budget</p>
                    <p className="text-lg font-black text-[#00f2ff] md:text-xl">
                      S${job.amount.toFixed(2)} / {(job.amount / POL_TO_SGD_RATE).toFixed(5)} POL
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#b9cacb]">Posted</p>
                    <p className="text-sm text-[#e5e2e3]">{new Date(job.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg bg-[#00f2ff] px-6 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#00363a] transition-all hover:brightness-110"
                  >
                    View Details
                  </button>
                </div>
              </article>
            );
          })}

          <div className="flex items-center justify-center gap-3 pt-2 text-sm text-[#b9cacb]">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() =>
                router.push(
                  `/job-portal?page=${page - 1}${view === "my-gigs" ? "&view=my-gigs" : ""}`
                )
              }
              className="rounded-md border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#e5e2e3] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              Page {page} of {jobs.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= jobs.totalPages}
              onClick={() =>
                router.push(
                  `/job-portal?page=${page + 1}${view === "my-gigs" ? "&view=my-gigs" : ""}`
                )
              }
              className="rounded-md border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#e5e2e3] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}
