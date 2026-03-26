"use client";

import { UserRole } from "@/generated/prisma-client";
import { DisputeDetailData, DisputeDetailProps, DisputeOutcome } from "@/type/disputeTypes";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DisputeEvidence } from "./DisputeEvidence";
import { DisputeDescriptionBox } from "./DisputeDescriptionBox";
import { AdminResolution } from "./AdminResolution";
import { TransactionTrail } from "./TransactionTrail";

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

    const txRows = dispute
        ? [
            { label: "Escrow funded", hash: dispute.job.fundedTxHash },
            { label: "Worker accepted job", hash: dispute.job.acceptTxHash },
            {
                label: "Worker requested release",
                hash: dispute.job.applyReleaseTxHash,
            },
            {
                label: "Employer approved release",
                hash: dispute.job.approveReleaseTxHash,
            },
            { label: "Dispute opened (freeze)", hash: dispute.freezeTxHash },
            {
                label: "Dispute resolution",
                hash: dispute.resolutionTxHash,
            },
        ]
        : [];


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
                    <DisputeDescriptionBox  {...dispute} />

                    <TransactionTrail items={txRows} />

                    <article className="rounded-xl border border-[#00f2ff]/15 bg-[#1c1b1c]/80 p-5">
                        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#00f2ff]">
                            Worker Fund Release Evidence
                        </h2>

                        {dispute.job.releaseEvidences.length === 0 ? (
                            <p className="text-sm text-[#b9cacb]">
                                No fund release evidence submitted.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {dispute.job.releaseEvidences.map((item) => (
                                    <div
                                        key={item.id}
                                        className="rounded-lg border border-white/10 bg-[#131314] p-3"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="text-[10px] uppercase tracking-[0.2em] text-[#00f2ff]">
                                                {item.type}
                                            </span>
                                            <span className="text-xs text-[#b9cacb]">
                                                {new Date(item.uploadedAt).toLocaleString()}
                                            </span>
                                        </div>
                                        {item.notes ? (
                                            <p className="mt-2 whitespace-pre-wrap text-sm text-[#e5e2e3]">
                                                {item.notes}
                                            </p>
                                        ) : null}
                                        <p className="mt-2 text-xs text-[#b9cacb]">
                                            Uploaded by user #{item.uploadedBy}
                                        </p>
                                        {item.fileUrl ? (
                                            <a
                                                href={item.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-2 inline-flex break-all text-sm text-[#00f2ff] hover:underline"
                                            >
                                                View evidence attachment
                                            </a>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        )}
                    </article>

                    <article className="rounded-xl border border-[#00f2ff]/15 bg-[#1c1b1c]/80 p-5">
                        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#00f2ff]">Evidence</h2>

                        {dispute.evidences.length === 0 ? (
                            <p className="text-sm text-[#b9cacb]">No evidence submitted yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {dispute.evidences.map((evidence) => (
                                    <DisputeEvidence key={evidence.id} {...evidence} />
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
                        <AdminResolution setError={setError} loadDispute={loadDispute} disputeId={disputeId} />
                    ) : null}
                </>
            ) : null}
        </section>
    );
}
