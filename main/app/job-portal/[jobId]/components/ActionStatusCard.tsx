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
    <div>
      {title ? <p>{title}</p> : null}
      <div>
        <p>
          <b>{dateLabel}:</b> {dateValue || "N/A"}
        </p>
        <br />
        <p className="break-words">
          <b>{hashLabel}:</b>{" "}
          {hasHash && href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-decoration-line text-blue-900"
            >
              {hashValue}
            </a>
          ) : (
            "N/A"
          )}
        </p>
      </div>
    </div>
  );
}
