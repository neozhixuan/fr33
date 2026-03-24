"use client";

import { JobStatus } from "@/generated/prisma-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type DisputeSummary = {
    id: number;
    jobId: number;
    status: string;
};

type DisputeActionsProps = {
    jobId: number;
    jobStatus: JobStatus;
    canOpenDispute: boolean;
    isAdmin?: boolean;
};

const OPENABLE_JOB_STATUSES: JobStatus[] = [
    JobStatus.IN_PROGRESS,
    JobStatus.PENDING_APPROVAL,
];

const ACTIVE_DISPUTE_STATUSES = new Set([
    "OPEN",
    "EVIDENCE_SUBMISSION",
    "UNDER_REVIEW",
    "DECIDED",
    "ONCHAIN_PENDING",
]);

export default function DisputeActions({
    jobId,
    jobStatus,
    canOpenDispute,
    isAdmin = false,
}: DisputeActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [existingDispute, setExistingDispute] = useState<DisputeSummary | null>(
        null,
    );
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const disputeAllowedByStatus = OPENABLE_JOB_STATUSES.includes(jobStatus);

    const canCreateDispute = useMemo(() => {
        return canOpenDispute && disputeAllowedByStatus && !existingDispute;
    }, [canOpenDispute, disputeAllowedByStatus, existingDispute]);

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            setError("");
            try {
                const scope = isAdmin ? "admin" : "my";
                const res = await fetch(`/api/disputes?scope=${scope}`, {
                    method: "GET",
                    cache: "no-store",
                });
                const data = await res.json();

                if (!res.ok || !data?.success) {
                    throw new Error(data?.error || "Failed to fetch disputes");
                }

                const matches: DisputeSummary[] = (data.disputes || [])
                    .filter((d: DisputeSummary) => d.jobId === jobId)
                    .sort((a: DisputeSummary, b: DisputeSummary) => b.id - a.id);

                const active = matches.find((d) => ACTIVE_DISPUTE_STATUSES.has(d.status));
                setExistingDispute(active || matches[0] || null);
            } catch (e) {
                setError((e as Error).message);
            } finally {
                setLoading(false);
            }
        };

        void run();
    }, [jobId, isAdmin]);

    const createDispute = async () => {
        setSubmitting(true);
        setError("");
        try {
            const res = await fetch("/api/disputes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    jobId,
                    reason: reason.trim() || undefined,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data?.success) {
                throw new Error(data?.error || "Failed to create dispute");
            }

            const disputeId = Number(data?.dispute?.id);
            if (Number.isInteger(disputeId) && disputeId > 0) {
                router.push(`/dispute/${disputeId}`);
                return;
            }

            router.push(`/dispute?jobId=${jobId}`);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="rounded-xl border border-[#00f2ff]/15 bg-[#1c1b1c]/80 p-5">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-[#00f2ff]">
                Dispute
            </h2>

            {loading ? (
                <p className="text-xs text-[#b9cacb]">Loading dispute status...</p>
            ) : existingDispute ? (
                <div className="space-y-3">
                    <p className="text-xs text-[#b9cacb]">
                        A dispute already exists for this job.
                    </p>
                    <p className="text-xs text-[#b9cacb]">
                        Status: <span className="text-[#e5e2e3]">{existingDispute.status}</span>
                    </p>
                    <Link
                        href={`/dispute/${existingDispute.id}`}
                        className="inline-flex rounded-md bg-[#00f2ff] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#00363a]"
                    >
                        Open Dispute
                    </Link>
                </div>
            ) : canCreateDispute ? (
                <div className="space-y-3">
                    <p className="text-xs text-[#b9cacb]">
                        Open a dispute if there is disagreement on delivery, scope, or payout.
                    </p>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Optional reason"
                        rows={3}
                        className="w-full rounded-md border border-white/15 bg-[#131314] px-3 py-2 text-sm text-[#e5e2e3] outline-none placeholder:text-[#b9cacb]/60"
                    />
                    <button
                        type="button"
                        onClick={createDispute}
                        disabled={submitting}
                        className="w-full rounded-md bg-[#00f2ff] px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#00363a] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting ? "Opening dispute..." : "Open Dispute"}
                    </button>
                </div>
            ) : (
                <p className="text-xs text-[#b9cacb]">
                    {isAdmin
                        ? "No open disputes found for this job."
                        : "Dispute can only be opened by the assigned worker or employer when job is in progress or pending approval. If you are an assigned worker or employer, this means that no disputes were found."}
                </p>
            )}

            {error && (
                <div className="mt-3 max-h-36 overflow-y-auto rounded border border-red-400/30 bg-red-500/10 p-3">
                    <p className="break-words text-xs text-red-300">{error}</p>
                </div>
            )}
            <Link
                href={`/dispute${jobId ? `?jobId=${jobId}` : ""}`}
                className="mt-4 inline-flex text-xs uppercase tracking-[0.2em] text-[#00f2ff] hover:underline"
            >
                View all disputes →
            </Link>
        </section>
    );
}
