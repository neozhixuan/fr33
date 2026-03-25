'use client';

import { ComplianceCase } from '@/lib/complianceActions';

interface ComplianceStatsProps {
    cases: ComplianceCase[];
}

export default function ComplianceStats({ cases }: ComplianceStatsProps) {
    const openCases = cases.filter((c) => c.status === 'OPEN').length;
    const dismissedCases = cases.filter((c) => c.status === 'DISMISSED').length;
    const actionedCases = cases.filter((c) => c.status === 'ACTIONED').length;
    const totalScore = cases.reduce((sum, c) => sum + c.scoreAtCreation, 0);

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-[#131314]/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Open Cases
                </p>
                <p className="mt-2 text-3xl font-bold text-[#00f2ff]">{openCases}</p>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#131314]/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Dismissed
                </p>
                <p className="mt-2 text-3xl font-bold text-green-400">{dismissedCases}</p>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#131314]/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Actioned
                </p>
                <p className="mt-2 text-3xl font-bold text-yellow-400">{actionedCases}</p>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#131314]/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Total Score
                </p>
                <p className="mt-2 text-3xl font-bold text-red-400">{totalScore}</p>
            </div>
        </div>
    );
}
