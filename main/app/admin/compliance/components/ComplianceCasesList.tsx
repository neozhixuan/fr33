'use client';

import { ComplianceCase, dismissComplianceCase, revokeVCForCase } from '@/lib/complianceActions';
import { formatDateTimeWithTZ } from '@/lib/dateFormatter';
import { useState } from 'react';
import CaseActionModal from './CaseActionModal';

interface ComplianceCasesListProps {
    cases: ComplianceCase[];
    onCaseUpdated: () => void;
}

type ActionType = 'dismiss' | 'revoke-vc' | null;

export default function ComplianceCasesList({
    cases,
    onCaseUpdated,
}: ComplianceCasesListProps) {
    const [selectedCase, setSelectedCase] = useState<ComplianceCase | null>(null);
    const [actionType, setActionType] = useState<ActionType>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const handleDismiss = async (caseId: number, notes: string) => {
        try {
            setActionLoading(true);
            await dismissComplianceCase(caseId, notes);
            setSelectedCase(null);
            setActionType(null);
            onCaseUpdated();
        } catch (error) {
            alert(`Failed to dismiss case: ${(error as Error).message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRevokeVC = async (caseId: number, notes: string) => {
        try {
            setActionLoading(true);
            await revokeVCForCase(caseId, notes);
            setSelectedCase(null);
            setActionType(null);
            onCaseUpdated();
        } catch (error) {
            alert(`Failed to revoke VC: ${(error as Error).message}`);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <>
            <div className="space-y-3">
                {cases.map((caseItem) => (
                    <div
                        key={caseItem.id}
                        className="rounded-lg border border-white/10 bg-[#131314]/60 p-4"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-semibold text-white">
                                        Case #{caseItem.id}
                                    </h3>
                                    <span
                                        className={`inline-block rounded px-2 py-1 text-xs font-semibold ${caseItem.status === 'OPEN'
                                            ? 'bg-red-500/20 text-red-400'
                                            : caseItem.status === 'DISMISSED'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-yellow-500/20 text-yellow-400'
                                            }`}
                                    >
                                        {caseItem.status}
                                    </span>
                                </div>

                                <p className="mt-2 text-sm text-gray-400">
                                    Wallet:{' '}
                                    <a className="font-mono text-xs text-blue-400 underline" href={caseItem.profile ? `https://amoy.polygonscan.com/address/${caseItem.profile.walletAddress}` : "#"}
                                        target="_blank"
                                        rel="noopener noreferrer">
                                        {caseItem.profile?.walletAddress || 'Unknown'}

                                    </a>
                                </p>

                                <p className="mt-1 text-sm text-gray-400">
                                    Score at creation:{' '}
                                    <span className="font-bold text-red-400">
                                        {caseItem.scoreAtCreation}
                                    </span>
                                </p>

                                {caseItem.triggeredRules.length > 0 && (
                                    <p className="mt-2 text-sm text-gray-400">
                                        Rules triggered:{' '}
                                        <span className="text-gray-300">
                                            {caseItem.triggeredRules.join(', ')}
                                        </span>
                                    </p>
                                )}

                                <p className="mt-1 text-xs text-gray-500">
                                    Created {formatDateTimeWithTZ(caseItem.createdAt)}
                                </p>

                                {caseItem.actionNotes && (
                                    <p className="mt-2 text-sm text-gray-300">
                                        <span className="font-semibold">Action notes:</span>{' '}
                                        {caseItem.actionNotes}
                                    </p>
                                )}
                            </div>

                            {caseItem.status === 'OPEN' && (
                                <div className="ml-4 flex flex-col gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedCase(caseItem);
                                            setActionType('dismiss');
                                        }}
                                        className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
                                    >
                                        Dismiss
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedCase(caseItem);
                                            setActionType('revoke-vc');
                                        }}
                                        className="rounded bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700"
                                    >
                                        Revoke VC
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Action Modal */}
            {selectedCase && actionType && (
                <CaseActionModal
                    caseId={selectedCase.id}
                    actionType={actionType}
                    onConfirm={
                        actionType === 'dismiss'
                            ? handleDismiss
                            : handleRevokeVC
                    }
                    onClose={() => {
                        setSelectedCase(null);
                        setActionType(null);
                    }}
                    isLoading={actionLoading}
                />
            )}
        </>
    );
}
