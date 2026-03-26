type TransactionTrailItem = {
    label: string;
    hash: string | null;
};

type TransactionTrailProps = {
    items: TransactionTrailItem[];
};

export function TransactionTrail({ items }: TransactionTrailProps) {
    return (
        <article className="rounded-xl border border-[#00f2ff]/15 bg-[#1c1b1c]/80 p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#00f2ff]">
                On-chain Transaction Trail
            </h2>
            <div className="space-y-2 text-sm">
                {items.map((row) => (
                    <div
                        key={row.label}
                        className="rounded-md border border-white/10 bg-[#131314] p-3"
                    >
                        <p className="text-[#b9cacb]">{row.label}</p>
                        {row.hash ? (
                            <a
                                href={`https://amoy.polygonscan.com/tx/${row.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="break-all text-[#00f2ff] hover:underline"
                            >
                                {row.hash}
                            </a>
                        ) : (
                            <p className="text-[#8b9b9c]">N/A</p>
                        )}
                    </div>
                ))}
            </div>
        </article>
    );
}
