'use client';

import { MonitoringLog } from '@/type/complianceTypes';
import { formatDateTimeWithTZ } from '@/lib/dateFormatter';

interface MonitoringLogsListProps {
    logs: MonitoringLog[];
}

export default function MonitoringLogsList({ logs }: MonitoringLogsListProps) {
    return (
        <div className="space-y-3">
            {logs.map((log) => (
                <div key={log.id} className="rounded-lg border border-white/10 bg-[#131314]/60 p-4">
                    <p className="text-sm font-semibold text-white">{log.eventType}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatDateTimeWithTZ(log.blockTimestamp)}</p>
                    <div className="mt-2 grid gap-1 text-sm text-gray-300 md:grid-cols-2">
                        <p>Job ID: {log.jobId}</p>
                        <p>Log Index: {log.logIndex}</p>
                        <p>Wallet: {log.walletAddress ?? '-'}</p>
                        <p>Counterparty: {log.counterpartyAddress ?? '-'}</p>
                        <p>Amount (wei): {log.amountWei ?? '-'}</p>
                        <p>Block: {log.blockNumber}</p>
                    </div>
                    <p className="mt-2 font-mono text-xs text-gray-400">Tx: {log.txHash}</p>
                    <p className="mt-1 font-mono text-xs text-gray-500">Source Event: {log.sourceEventId}</p>
                </div>
            ))}
        </div>
    );
}
