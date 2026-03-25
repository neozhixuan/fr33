'use client';

import { useState } from 'react';

interface CaseActionModalProps {
    caseId: number;
    actionType: 'dismiss' | 'revoke-vc';
    onConfirm: (caseId: number, notes: string) => Promise<void>;
    onClose: () => void;
    isLoading: boolean;
}

export default function CaseActionModal({
    caseId,
    actionType,
    onConfirm,
    onClose,
    isLoading,
}: CaseActionModalProps) {
    const [notes, setNotes] = useState('');

    const handleConfirm = async () => {
        await onConfirm(caseId, notes);
    };

    const title =
        actionType === 'dismiss'
            ? 'Dismiss Case'
            : 'Revoke Verifiable Credential';

    const description =
        actionType === 'dismiss'
            ? 'Are you sure you want to dismiss this case? This action cannot be undone.'
            : 'Are you sure you want to revoke the VC for this user? This will revoke their credentials.';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#131314] p-6">
                <h2 className="text-lg font-bold text-white">{title}</h2>
                <p className="mt-2 text-sm text-gray-400">{description}</p>

                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional: Add notes for this action..."
                    className="mt-4 w-full rounded border border-white/10 bg-[#0f0f10] p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00f2ff]"
                    rows={3}
                />

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 rounded border border-white/10 px-4 py-2 font-medium text-gray-300 hover:bg-white/10 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={`flex-1 rounded px-4 py-2 font-medium text-white ${actionType === 'dismiss'
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-red-600 hover:bg-red-700'
                            } disabled:opacity-50`}
                    >
                        {isLoading ? 'Processing...' : title}
                    </button>
                </div>
            </div>
        </div>
    );
}
