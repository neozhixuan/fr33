'use client';

import { revokeVCManually } from '@/lib/complianceActions';
import { useState } from 'react';

interface ManualVCRevokePanelProps {
    onSuccess: () => void;
}

export default function ManualVCRevokePanel({ onSuccess }: ManualVCRevokePanelProps) {
    const [vcHash, setVcHash] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vcHash.trim()) {
            alert('VC hash is required.');
            return;
        }

        try {
            setLoading(true);
            await revokeVCManually(vcHash.trim(), notes.trim() || undefined);
            setVcHash('');
            setNotes('');
            onSuccess();
            alert('VC revoked successfully.');
        } catch (error) {
            alert(`Failed to revoke VC: ${(error as Error).message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rounded-lg border border-white/10 bg-[#131314]/60 p-4">
            <h3 className="text-lg font-semibold text-white">Manual VC Revocation</h3>
            <p className="mt-1 text-sm text-gray-400">
                Revoke any VC directly by hash (not limited to an existing compliance case).
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.18em] text-gray-400">
                        VC Hash
                    </label>
                    <input
                        type="text"
                        value={vcHash}
                        onChange={(e) => setVcHash(e.target.value)}
                        placeholder="0x..."
                        className="w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#00f2ff]"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.18em] text-gray-400">
                        Notes (optional)
                    </label>
                    <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Reason for revocation"
                        className="w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#00f2ff]"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? 'Revoking...' : 'Revoke VC'}
                </button>
            </form>
        </div>
    );
}
