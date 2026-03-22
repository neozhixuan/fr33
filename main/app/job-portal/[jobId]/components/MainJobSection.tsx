import { JobStatus } from "@/generated/prisma-client";
import { JobForClientType } from "@/utils/types";
import { POL_TO_SGD_RATE } from "@/utils/constants";

export default function MainJobSection({ job }: { job: JobForClientType }) {
  const statusLabel =
    job.status === JobStatus.POSTED ? "OPEN" : job.status.replaceAll("_", " ");

  return (
    <section className="rounded-xl border border-[#00f2ff]/15 bg-[#201f20]/70 p-6 shadow-[0_0_45px_rgba(0,242,255,0.06)] md:p-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[#b9cacb]">Job ID #{job.id}</p>
        <span className="rounded-full border border-[#7cf39e]/40 bg-[#7cf39e]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#7cf39e]">
          {statusLabel}
        </span>
      </div>

      <h1 className="text-2xl font-black tracking-tight text-[#e5e2e3] md:text-3xl">{job.title}</h1>

      <p className="mt-4 whitespace-pre-wrap leading-relaxed text-[#b9cacb]">{job.description}</p>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-[#131314] p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#b9cacb]">Budget</p>
          <p className="mt-1 text-lg font-black text-[#00f2ff]">S${job.amount.toFixed(2)}</p>
          <p className="text-xs text-[#b9cacb]">{(job.amount / POL_TO_SGD_RATE).toFixed(5)} POL</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#131314] p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#b9cacb]">Created</p>
          <p className="mt-1 text-sm font-semibold text-[#e5e2e3]">
            {new Date(job.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#131314] p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#b9cacb]">Employer</p>
          <p className="mt-1 text-sm font-semibold text-[#e5e2e3]">ID {job.employerId}</p>
        </div>
      </div>
    </section>
  );
}
