'use client';

import { MainServiceAuditLog } from '@/type/complianceTypes';
import { formatDateTimeWithTZ } from '@/lib/dateFormatter';

interface MainAuditLogsListProps {
    logs: MainServiceAuditLog[];
}

export default function MainAuditLogsList({ logs }: MainAuditLogsListProps) {
    const formatJson = (value: unknown) => {
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return String(value);
        }
    };

    return (
        <div className="space-y-3">
            {logs.map((log) => (
                <div key={log.id} className="rounded-lg border border-white/10 bg-[#131314]/60 p-4">
                    <p className="text-sm font-semibold text-white">{log.action}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatDateTimeWithTZ(log.createdAt)}</p>
                    <div className="mt-2 grid gap-1 text-sm text-gray-300 md:grid-cols-2">
                        <p>User: {log.userId ?? '-'} {log.userEmail ? `• ${log.userEmail}` : ''}</p>
                        <p>Result: {log.result}</p>
                        <p>Wallet: {log.walletAddress ?? '-'}</p>
                        <p>IP: {log.ipAddress ?? '-'}</p>
                    </div>
                    {log.metadata ? (
                        <details className="mt-2 rounded border border-white/10 bg-black/20 p-2 text-xs text-gray-300">
                            <summary className="cursor-pointer text-gray-400">Metadata</summary>
                            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded bg-black/30 p-2 text-[11px] text-gray-300">
                                {formatJson(log.metadata)}
                            </pre>
                        </details>
                    ) : null}
                </div>
            ))}
        </div>
    );
}
