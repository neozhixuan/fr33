"use client";

import { UserRole } from "@/generated/prisma-client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type DisputeEvidence = {
    id: number;
    submittedByRole: string;
    evidenceType: string;
    contentText: string;
    createdAt: string;
};

type DisputeDetailData = {
    id: number;
    jobId: number;
    status: string;
    decision: string | null;
    decisionReason: string | null;
    workerShareBps: number | null;
    openedAt: string;
    updatedAt: string;
    job: {
        id: number;
        title: string;
        employerId: number;
        workerWallet: string | null;
        status: string;
    };
    evidences: DisputeEvidence[];
};

type DisputeDetailProps = {
    disputeId: number;
    role: UserRole;
};

const ADMIN_RESOLVABLE_STATUSES = new Set([
    "OPEN",
    "EVIDENCE_SUBMISSION",
    "UNDER_REVIEW",
    "DECIDED",
    "ONCHAIN_PENDING",
]);

export default function DisputeDetail({ disputeId, role }: DisputeDetailProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [dispute, setDispute] = useState<DisputeDetailData | null>(null);

    const [evidenceText, setEvidenceText] = useState("");
    const [evidencePending, setEvidencePending] = useState(false);

    const [outcome, setOutcome] = useState<
        "RELEASE_TO_WORKER" | "RETURN_TO_EMPLOYER" | "SPLIT"
    >("RELEASE_TO_WORKER");
    const [rationale, setRationale] = useState("");
    const [workerSharePct, setWorkerSharePct] = useState<number>(50);
    const [resolvePending, setResolvePending] = useState(false);

    const canAdminResolve =
        role === UserRole.ADMIN &&
        dispute &&
        ADMIN_RESOLVABLE_STATUSES.has(dispute.status);

    const canSubmitEvidence = useMemo(() => {
        if (!dispute) return false;
        if (role === UserRole.ADMIN) return false;
        return ["OPEN", "EVIDENCE_SUBMISSION", "UNDER_REVIEW"].includes(
            dispute.status,
        );
    }, [dispute, role]);

    const loadDispute = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/disputes/${disputeId}`, {
                method: "GET",
                cache: "no-store",
            });
            const data = await res.json();
            if (!res.ok || !data?.success) {
                throw new Error(data?.error || "Failed to load dispute");
            }
            setDispute(data.dispute || null);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
    }, [disputeId]);

    useEffect(() => {
        void loadDispute();
    }, [loadDispute]);

    const submitEvidence = async () => {
        const contentText = evidenceText.trim();
        if (!contentText) {
            setError("Evidence text is required");
            return;
        }

        setEvidencePending(true);
        setError("");
        try {
            const res = await fetch(`/api/disputes/${disputeId}/evidence`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    evidenceType: "STATEMENT",
                    contentText,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data?.success) {
                throw new Error(data?.error || "Failed to submit evidence");
            }
            setEvidenceText("");
            await loadDispute();
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setEvidencePending(false);
        }
    };

    const resolveDispute = async () => {
        if (!rationale.trim()) {
            setError("Rationale is required");
            return;
        }

        setResolvePending(true);
        setError("");
        try {
            const workerShareBps =
                outcome === "SPLIT" ? Math.round(workerSharePct * 100) : undefined;

            const res = await fetch(`/api/disputes/${disputeId}/decide`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    outcome,
                    rationale: rationale.trim(),
                    workerShareBps,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data?.success) {
                throw new Error(data?.error || "Failed to resolve dispute");
            }

            setRationale("");
            await loadDispute();
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setResolvePending(false);
        }
    };

    return (
        <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#00f2ff]/15 bg-[#1c1b1c]/80 p-5">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#b9cacb]">Dispute #{disputeId}</p>
                    <h1 className="mt-1 text-2xl font-black tracking-tight text-[#e5e2e3]">Dispute Details</h1>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/dispute"
                        className="rounded-md border border-white/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#e5e2e3]"
                    >
                        Back to disputes
                    </Link>
                    {dispute?.jobId ? (
                        <Link
                            href={`/job-portal/${dispute.jobId}`}
                            className="rounded-md bg-[#00f2ff] px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#00363a]"
                        >
                            Open job
                        </Link>
                    ) : null}
                </div>
            </div>

            {loading ? <p className="text-sm text-[#b9cacb]">Loading dispute...</p> : null}
            {error ? <p className="text-sm text-red-300">{error}</p> : null}

            {dispute ? (
                <>
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

                    <article className="rounded-xl border border-[#00f2ff]/15 bg-[#1c1b1c]/80 p-5">
                        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#00f2ff]">Evidence</h2>

                        {dispute.evidences.length === 0 ? (
                            <p className="text-sm text-[#b9cacb]">No evidence submitted yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {dispute.evidences.map((evidence) => (
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
                                ))}
                            </div>
                        )}

                        {canSubmitEvidence ? (
                            <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                                <textarea
                                    value={evidenceText}
                                    onChange={(e) => setEvidenceText(e.target.value)}
                                    rows={4}
                                    placeholder="Add evidence statement..."
                                    className="w-full rounded-md border border-white/15 bg-[#131314] px-3 py-2 text-sm text-[#e5e2e3] outline-none placeholder:text-[#b9cacb]/60"
                                />
                                <button
                                    type="button"
                                    onClick={submitEvidence}
                                    disabled={evidencePending}
                                    className="rounded-md bg-[#00f2ff] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#00363a] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {evidencePending ? "Submitting..." : "Submit evidence"}
                                </button>
                            </div>
                        ) : null}
                    </article>

                    {canAdminResolve ? (
                        <article className="rounded-xl border border-[#00f2ff]/15 bg-[#1c1b1c]/80 p-5">
                            <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#00f2ff]">
                                Admin Resolution
                            </h2>

                            <div className="space-y-3">
                                <div>
                                    <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-[#b9cacb]">Outcome</label>
                                    <select
                                        value={outcome}
                                        onChange={(e) =>
                                            setOutcome(
                                                e.target.value as
                                                | "RELEASE_TO_WORKER"
                                                | "RETURN_TO_EMPLOYER"
                                                | "SPLIT",
                                            )
                                        }
                                        className="w-full rounded-md border border-white/15 bg-[#131314] px-3 py-2 text-sm text-[#e5e2e3]"
                                    >
                                        <option value="RELEASE_TO_WORKER">Release to worker</option>
                                        <option value="RETURN_TO_EMPLOYER">Return to employer</option>
                                        <option value="SPLIT">Split</option>
                                    </select>
                                </div>

                                {outcome === "SPLIT" ? (
                                    <div>
                                        <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-[#b9cacb]">
                                            Worker share (%)
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={workerSharePct}
                                            onChange={(e) => setWorkerSharePct(Number(e.target.value || 0))}
                                            className="w-full rounded-md border border-white/15 bg-[#131314] px-3 py-2 text-sm text-[#e5e2e3]"
                                        />
                                    </div>
                                ) : null}

                                <div>
                                    <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-[#b9cacb]">Rationale</label>
                                    <textarea
                                        value={rationale}
                                        onChange={(e) => setRationale(e.target.value)}
                                        rows={4}
                                        placeholder="Describe why this resolution is chosen..."
                                        className="w-full rounded-md border border-white/15 bg-[#131314] px-3 py-2 text-sm text-[#e5e2e3] outline-none placeholder:text-[#b9cacb]/60"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={resolveDispute}
                                    disabled={resolvePending}
                                    className="rounded-md bg-[#00f2ff] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#00363a] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {resolvePending ? "Submitting on-chain..." : "Resolve dispute"}
                                </button>
                            </div>
                        </article>
                    ) : null}
                </>
            ) : null}
        </section>
    );
}
