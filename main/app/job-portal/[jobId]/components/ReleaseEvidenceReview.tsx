"use client";

import { ReleaseEvidenceItem } from "@/type/general";
import Image from "next/image";
import { formatDateConsistent } from "@/utils/constants";

type ReleaseEvidenceReviewProps = {
    releaseEvidences: ReleaseEvidenceItem[];
};

export default function ReleaseEvidenceReview({
    releaseEvidences,
}: ReleaseEvidenceReviewProps) {
    return (
        <article className="rounded-md border border-white/10 bg-[#131314]/60 p-4">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#00f2ff]">
                Worker-submitted release evidence
            </h3>
            <div className="space-y-3">
                {releaseEvidences.map((evidence) => (
                    <div
                        key={evidence.id}
                        className="rounded-md border border-white/10 bg-[#0f0f10] p-3"
                    >
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[#b9cacb]">
                            Submitted {formatDateConsistent(evidence.uploadedAt)} by user #
                            {evidence.uploadedBy}
                        </p>
                        {evidence.notes ? (
                            <p className="mt-2 whitespace-pre-wrap text-sm text-[#e5e2e3]">
                                {evidence.notes}
                            </p>
                        ) : null}
                        {evidence.fileUrl ? (
                            <div className="mt-3">
                                <Image
                                    src={evidence.fileUrl}
                                    alt="Evidence"
                                    width={400}
                                    height={400}
                                    className="max-h-64 rounded-md border border-white/10 object-cover"
                                    unoptimized={evidence.fileUrl.startsWith("data:")}
                                />
                                <a
                                    href={evidence.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-block text-xs text-[#00f2ff] hover:underline"
                                >
                                    Open image in original URL
                                </a>
                            </div>
                        ) : null}
                    </div>
                ))}
            </div>
        </article>
    );
}
