'use client';

import { ComplianceCase } from '@/type/complianceTypes';

interface CaseAccountDetailsProps {
    caseItem: ComplianceCase;
}

export default function CaseAccountDetails({ caseItem }: CaseAccountDetailsProps) {
    const walletAddress = caseItem.account?.address || caseItem.profile?.walletAddress || 'Unknown';
    return (
        <>
            <p className="mt-2 text-sm text-gray-400">
                Wallet:{' '}
                <a
                    className="font-mono text-xs text-blue-400 underline"
                    href={`https://amoy.polygonscan.com/address/${walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {walletAddress}
                </a>
            </p>

            {caseItem.account?.user && (
                <div className="mt-2 rounded-md border border-white/10 bg-black/20 p-2 text-xs text-gray-300">
                    <p>
                        User #{caseItem.account.user.id} • {caseItem.account.user.email}
                    </p>
                    <p>
                        Role: {caseItem.account.user.role} • Onboarding: {caseItem.account.user.onboardingStage}
                    </p>
                    <p className="font-mono text-[11px] text-gray-400">
                        DID: {caseItem.account.did}
                    </p>
                    <p>
                        Wallet status: {caseItem.account.walletStatus}
                    </p>
                    {caseItem.account.vcMetadata ? (
                        <p>
                            VC: {caseItem.account.vcMetadata.status} • hash {caseItem.account.vcMetadata.vcHash}
                        </p>
                    ) : (
                        <p>VC: Not found</p>
                    )}
                </div>
            )}
        </>
    );
}
