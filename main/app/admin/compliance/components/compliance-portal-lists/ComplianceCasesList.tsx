'use client';

import { dismissComplianceCase, revokeVCForCase } from '@/lib/complianceActions';
import { useState } from 'react';
import CaseActionModal from '../CaseActionModal';
import { ComplianceCase as ComplianceCaseType } from '@/type/complianceTypes';
import { CaseItem } from '../CaseItem';

interface ComplianceCasesListProps {
    cases: ComplianceCaseType[];
    onCaseUpdated: () => void;
}

type ActionType = 'dismiss' | 'revoke-vc' | null;

export default function ComplianceCasesList({
    cases,
    onCaseUpdated,
}: ComplianceCasesListProps) {
    const [selectedCase, setSelectedCase] = useState<ComplianceCaseType | null>(null);
    const [actionType, setActionType] = useState<ActionType>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const handleDismiss = async (caseId: number) => {
        try {
            setActionLoading(true);
            await dismissComplianceCase(caseId);
            setSelectedCase(null);
            setActionType(null);
            onCaseUpdated();
        } catch (error) {
            alert(`Failed to dismiss case: ${(error as Error).message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRevokeVC = async (caseId: number) => {
        try {
            setActionLoading(true);
            const targetCase = cases.find((item) => item.id === caseId);
            const vcHash = targetCase?.account?.vcMetadata?.vcHash;
            if (!vcHash) {
                throw new Error('No VC hash found for this wallet.');
            }

            await revokeVCForCase(caseId, vcHash);
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
                {cases.map((caseItem) =>
                    <CaseItem key={caseItem.id}
                        caseItem={caseItem}
                        setSelectedCase={setSelectedCase}
                        setActionType={setActionType}
                    />)}
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
