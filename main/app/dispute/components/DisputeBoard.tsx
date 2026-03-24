"use client";

import { UserRole } from "@/generated/prisma-client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type DisputeSummary = {
    id: number;
    jobId: number;
    status: string;
    openedByUserId: number;
    openedAt: string;
    createdAt: string;
    updatedAt: string;
    decisionReason: string | null;
};

type DisputeBoardProps = {
    role: UserRole;
    initialJobId?: number;
};

export default function DisputeBoard({ role, initialJobId }: DisputeBoardProps) {
    const [scope, setScope] = useState<"my" | "admin">("my");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [disputes, setDisputes] = useState<DisputeSummary[]>([]);

    const effectiveScope = role === UserRole.ADMIN ? scope : "my";

    const filteredDisputes = useMemo(() => {
        if (!initialJobId) return disputes;
        return disputes.filter((d) => d.jobId === initialJobId);
    }, [disputes, initialJobId]);

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            setError("");
            try {
                const res = await fetch(`/api/disputes?scope=${effectiveScope}`, {
                    method: "GET",
                    cache: "no-store",
                });
                const data = await res.json();
                if (!res.ok || !data?.success) {
                    throw new Error(data?.error || "Failed to load disputes");
                }
                setDisputes(data.disputes || []);
            } catch (e) {
                setError((e as Error).message);
            } finally {
                setLoading(false);
            }
        };

        void run();
    }, [effectiveScope]);

    return (
        <section className="rounded-xl border border-[#00f2ff]/15 bg-[#1c1b1c]/80 p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#00f2ff]">
                    {effectiveScope === "admin" ? "Open disputes (admin)" : "My disputes"}
                </h2>
                {role === UserRole.ADMIN && (
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setScope("my")}
                            className={`rounded-md px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] ${scope === "my"
                                    ? "bg-[#00f2ff] text-[#00363a]"
                                    : "border border-white/20 text-[#e5e2e3]"
                                }`}
                        >
                            My
                        </button>
                        <button
                            type="button"
                            onClick={() => setScope("admin")}
                            className={`rounded-md px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] ${scope === "admin"
                                    ? "bg-[#00f2ff] text-[#00363a]"
                                    : "border border-white/20 text-[#e5e2e3]"
                                }`}
                        >
                            Admin
                        </button>
                    </div>
                )}
            </div>

            {initialJobId ? (
                <p className="mb-4 text-xs text-[#b9cacb]">Filtering by Job #{initialJobId}</p>
            ) : null}

            {loading ? <p className="text-sm text-[#b9cacb]">Loading...</p> : null}
            {error ? <p className="text-sm text-red-300">{error}</p> : null}

            {!loading && !error && filteredDisputes.length === 0 ? (
                <p className="text-sm text-[#b9cacb]">No disputes found.</p>
            ) : null}

            <div className="space-y-3">
                {filteredDisputes.map((d) => (
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
                ))}
            </div>
        </section>
    );
}
