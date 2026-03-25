import { DisputeOutcome } from "@/type/disputeTypes";
import { useState } from "react";

type AdminResolutionProps = {
    setError: (msg: string) => void;
    loadDispute: () => Promise<void>;
    disputeId: number;
}

export function AdminResolution({ setError, loadDispute, disputeId }: AdminResolutionProps) {
    const [outcome, setOutcome] = useState<DisputeOutcome>("RELEASE_TO_WORKER");
    const [rationale, setRationale] = useState("");
    const [workerSharePct, setWorkerSharePct] = useState<number>(50);
    const [resolvePending, setResolvePending] = useState(false);

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
    )
}