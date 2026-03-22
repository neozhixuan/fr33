"use client";

interface ActionStatusCardProps {
  title?: string;
  dateLabel: string;
  dateValue: string;
  hashLabel: string;
  hashValue: string;
  explorerPrefix?: string;
}

export default function ActionStatusCard({
  title,
  dateLabel,
  dateValue,
  hashLabel,
  hashValue,
  explorerPrefix = "https://amoy.polygonscan.com/tx/",
}: ActionStatusCardProps) {
  const hasHash = Boolean(hashValue);
  const href = hasHash ? `${explorerPrefix}${hashValue}` : undefined;

  return (
    <div className="space-y-3 rounded-lg border border-white/10 bg-[#131314] p-4">
      {title ? <p className="text-sm font-semibold text-[#e5e2e3]">{title}</p> : null}
      <p className="text-sm text-[#b9cacb]">
        <span className="font-semibold text-[#e5e2e3]">{dateLabel}:</span>{" "}
        {dateValue || "N/A"}
      </p>
      <p className="break-words text-sm text-[#b9cacb]">
        <span className="font-semibold text-[#e5e2e3]">{hashLabel}:</span>{" "}
        {hasHash && href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00f2ff] hover:underline"
          >
            {hashValue}
          </a>
        ) : (
          "N/A"
        )}
      </p>
    </div>
  );
}
