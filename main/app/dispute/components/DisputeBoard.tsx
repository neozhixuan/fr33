"use client";

import { UserRole } from "@/generated/prisma-client";
import { DisputeSummary } from "@/type/disputeTypes";
import { useEffect, useMemo, useState } from "react";
import { DisputeItem } from "./DisputeItem";
import { RoleToggleButton } from "./RoleToggleButton";

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
                        <RoleToggleButton
                            roleName="My"
                            isActive={scope === "my"}
                            onClick={() => setScope("my")}
                        />
                        <RoleToggleButton
                            roleName="Admin"
                            isActive={scope === "admin"}
                            onClick={() => setScope("admin")}
                        />
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
                    <DisputeItem key={d.id} {...d} />
                ))}
            </div>
        </section>
    );
}
