import { DisputeDetailData } from "@/type/disputeTypes";

export function DisputeEvidence(evidence: DisputeDetailData["evidences"][number]) {
    return (
        <div key={evidence.id} className="rounded-lg border border-white/10 bg-[#131314] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#00f2ff]">
                    {evidence.evidenceType} · {evidence.submittedByRole}
                </span>
                <span className="text-xs text-[#b9cacb]">
                    {new Date(evidence.createdAt).toLocaleString()}
                </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-[#e5e2e3]">{evidence.contentText}</p>
        </div>

    )
}