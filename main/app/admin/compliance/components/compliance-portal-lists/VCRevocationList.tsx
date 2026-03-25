'use client';

import { revokeVCManually } from '@/lib/complianceActions';
import { formatDateTimeWithTZ } from '@/lib/dateFormatter';
import { useState } from 'react';
import { VCInventoryItem } from "@/type/complianceTypes";

interface VCRevocationListProps {
    rows: VCInventoryItem[];
    total: number;
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onRevoked: () => void;
}

export default function VCRevocationList({
    rows,
    total,
    page,
    pageSize,
    onPageChange,
    onRevoked,
}: VCRevocationListProps) {
    const [revokingHash, setRevokingHash] = useState<string | null>(null);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const handleRevoke = async (row: VCInventoryItem) => {
        const confirmed = window.confirm(`Revoke VC for wallet ${row.walletAddress}?`);
        if (!confirmed) return;

        try {
            setRevokingHash(row.vcHash);
            await revokeVCManually(row.vcHash, `Manual revoke for wallet ${row.walletAddress}`);
            onRevoked();
        } catch (error) {
            alert(`Failed to revoke VC: ${(error as Error).message}`);
        } finally {
            setRevokingHash(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-[#131314]/60 p-4">
                <p className="text-sm text-gray-300">
                    Showing page <span className="font-semibold text-white">{page}</span> of{' '}
                    <span className="font-semibold text-white">{totalPages}</span> ({total} total VCs)
                </p>
            </div>

            <div className="space-y-3">
                {rows.map((row) => (
                    <div key={`${row.walletId}-${row.vcHash}`} className="rounded-lg border border-white/10 bg-[#131314]/60 p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1 text-sm text-gray-300">
                                <p>
                                    <span className="text-gray-400">User:</span> #{row.userId} • {row.userEmail} • {row.userRole}
                                </p>
                                <p>
                                    <span className="text-gray-400">Wallet:</span>{' '}
                                    <a
                                        className="font-mono text-xs text-blue-400 underline"
                                        href={`https://amoy.polygonscan.com/address/${row.walletAddress}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {row.walletAddress}
                                    </a>
                                </p>
                                <p className="font-mono text-xs text-gray-400">DID: {row.walletDid}</p>
                                <p className="font-mono text-xs text-gray-300">VC Hash: {row.vcHash}</p>
                                <p>
                                    <span className="text-gray-400">Status:</span> {row.status}
                                </p>
                                <p>
                                    <span className="text-gray-400">Issued:</span> {formatDateTimeWithTZ(row.issuedAt)}
                                </p>
                                <p>
                                    <span className="text-gray-400">Expires:</span> {formatDateTimeWithTZ(row.expiresAt)}
                                </p>
                                {row.revokedAt ? (
                                    <p>
                                        <span className="text-gray-400">Revoked:</span> {formatDateTimeWithTZ(row.revokedAt)}
                                    </p>
                                ) : null}
                            </div>

                            <button
                                onClick={() => handleRevoke(row)}
                                disabled={row.status === 'REVOKED' || revokingHash === row.vcHash}
                                className="rounded bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {revokingHash === row.vcHash ? 'Revoking...' : row.status === 'REVOKED' ? 'Already Revoked' : 'Revoke VC'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-end gap-2">
                <button
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="rounded border border-white/10 px-3 py-1 text-sm text-gray-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Previous
                </button>
                <button
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="rounded border border-white/10 px-3 py-1 text-sm text-gray-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
