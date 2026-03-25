'use client';

interface CaseActionModalProps {
    caseId: number;
    actionType: 'dismiss' | 'revoke-vc';
    onConfirm: (caseId: number) => Promise<void>;
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
    const handleConfirm = async () => {
        await onConfirm(caseId);
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
