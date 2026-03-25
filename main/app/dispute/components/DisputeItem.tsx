import { DisputeSummary } from "@/type/disputeTypes";
import Link from "next/link";

export function DisputeItem(d: DisputeSummary) {
    return (
        <article
            key={d.id}
            className="rounded-lg border border-white/10 bg-[#131314] p-4"
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#b9cacb]">
                        Dispute #{d.id}
                    </p>
                    <p className="mt-1 text-sm text-[#e5e2e3]">Job #{d.jobId}</p>
                </div>
                <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#00f2ff]">
                    {d.status}
                </span>
            </div>

            {d.decisionReason ? (
                <p className="mt-3 text-sm text-[#b9cacb]">Reason: {d.decisionReason}</p>
            ) : null}

            <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs text-[#b9cacb]">
                    Opened: {new Date(d.openedAt || d.createdAt).toLocaleString()}
                </p>
                <Link
                    href={`/dispute/${d.id}`}
                    className="rounded-md bg-[#00f2ff] px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#00363a]"
                >
                    Open
                </Link>
            </div>
        </article>

    )
}