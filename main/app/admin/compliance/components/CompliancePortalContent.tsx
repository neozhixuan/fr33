'use client';

import { useEffect, useState } from 'react';
import { listComplianceCases, ComplianceCase } from '@/lib/complianceActions';
import ComplianceCasesList from './ComplianceCasesList';
import ComplianceStats from './ComplianceStats';

export default function CompliancePortalContent() {
    const [cases, setCases] = useState<ComplianceCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'open' | 'all'>('open');

    useEffect(() => {
        const fetchCases = async () => {
            try {
                setLoading(true);
                const status = activeTab === 'open' ? 'OPEN' : undefined;
                const response = await listComplianceCases({
                    status,
                    limit: 100,
                });
                setCases(response.cases);
                setError(null);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchCases();
    }, [activeTab]);

    return (
        <div className="space-y-6">
            {/* Statistics */}
            <ComplianceStats cases={cases} />

            {/* Error display */}
            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                    <p className="text-sm text-red-400">Error: {error}</p>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('open')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'open'
                        ? 'border-b-2 border-[#00f2ff] text-[#00f2ff]'
                        : 'text-gray-400 hover:text-gray-200'
                        }`}
                >
                    Open Cases ({cases.filter((c) => c.status === 'OPEN').length})
                </button>
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'all'
                        ? 'border-b-2 border-[#00f2ff] text-[#00f2ff]'
                        : 'text-gray-400 hover:text-gray-200'
                        }`}
                >
                    All Cases ({cases.length})
                </button>
            </div>

            {/* Cases list */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <p className="text-gray-400">Loading compliance cases...</p>
                </div>
            ) : cases.length === 0 ? (
                <div className="rounded-lg border border-white/10 bg-[#131314]/60 p-8 text-center">
                    <p className="text-gray-400">No compliance cases found</p>
                </div>
            ) : (
                <ComplianceCasesList cases={cases} onCaseUpdated={() => window.location.reload()} />
            )}
        </div>
    );
}
