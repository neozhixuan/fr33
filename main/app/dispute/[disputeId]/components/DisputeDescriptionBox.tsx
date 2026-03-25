import { DisputeDetailData } from "@/type/disputeTypes";

export function DisputeDescriptionBox(dispute: DisputeDetailData) {
    return (
        <article className="rounded-xl border border-[#00f2ff]/15 bg-[#1c1b1c]/80 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-sm text-[#b9cacb]">Job #{dispute.jobId}</p>
                    <p className="mt-1 text-lg font-bold text-[#e5e2e3]">{dispute.job?.title || "Untitled job"}</p>
                </div>
                <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#00f2ff]">
                    {dispute.status}
                </span>
            </div>

            {dispute.decisionReason ? (
                <p className="mt-4 text-sm text-[#b9cacb]">Current reason: {dispute.decisionReason}</p>
            ) : null}

            <p className="mt-2 text-xs text-[#b9cacb]">
                Opened: {new Date(dispute.openedAt || dispute.updatedAt).toLocaleString()}
            </p>
        </article>
    )
}