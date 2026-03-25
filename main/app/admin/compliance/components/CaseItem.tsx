import { formatDateTimeWithTZ } from '@/lib/dateFormatter';
import CaseAccountDetails from './CaseAccountDetails';
import { ComplianceCase as ComplianceCaseType, ComplianceRuleTrigger } from '@/type/complianceTypes';
import {
    getComplianceRuleDescription,
    getComplianceRuleTriggerSummary,
} from '@/utils/complianceRuleMetadata';

type CaseItemType = {
    caseItem: ComplianceCaseType;
    setSelectedCase: (caseItem: ComplianceCaseType | null) => void;
    setActionType: (actionType: 'dismiss' | 'revoke-vc' | null) => void;
}

export function CaseItem({ caseItem, setSelectedCase, setActionType }: CaseItemType) {
    const formatJson = (value: unknown) => {
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return String(value);
        }
    };

    return (
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

                    <CaseAccountDetails caseItem={caseItem} />

                    <p className="mt-1 text-sm text-gray-400">
                        Score at creation:{' '}
                        <span className="font-bold text-red-400">
                            {caseItem.scoreAtCreation}
                        </span>
                    </p>

                    {caseItem.triggeredRules.length > 0 && (
                        <div className="mt-2 space-y-1 text-sm text-gray-400">
                            <p>
                                Rules triggered:{' '}
                                <span className="text-gray-300">
                                    {caseItem.triggeredRules.join(', ')}
                                </span>
                            </p>
                            <ul className="space-y-1 text-xs text-gray-400">
                                {Array.from(new Set(caseItem.triggeredRules)).map((ruleName) => (
                                    <li key={ruleName}>
                                        <span className="font-medium text-gray-300">{ruleName}:</span>{' '}
                                        {getComplianceRuleDescription(ruleName)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <p className="mt-1 text-xs text-gray-500">
                        Created {formatDateTimeWithTZ(caseItem.createdAt)}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                        Updated {formatDateTimeWithTZ(caseItem.updatedAt)}
                        {caseItem.closedAt ? ` • Closed ${formatDateTimeWithTZ(caseItem.closedAt)}` : ''}
                    </p>

                    {caseItem.actionTxHash && (
                        <p className="mt-1 text-xs text-yellow-300">
                            Action Tx: {caseItem.actionTxHash}
                        </p>
                    )}

                    {caseItem.ruleTriggers && caseItem.ruleTriggers.length > 0 && (
                        <div className="mt-3 space-y-2 rounded-md border border-white/10 bg-black/20 p-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-[#00f2ff]">
                                Rule trigger metadata
                            </p>
                            {caseItem.ruleTriggers.slice(0, 5).map((trigger: ComplianceRuleTrigger) => (
                                <div key={trigger.id} className="rounded border border-white/10 p-2 text-xs text-gray-300">
                                    <p>
                                        {trigger.ruleName} • +{trigger.scoreDelta} @ {formatDateTimeWithTZ(trigger.triggeredAt)}
                                    </p>
                                    <p className="mt-1 text-gray-400">{getComplianceRuleDescription(trigger.ruleName)}</p>
                                    <p className="mt-1 text-gray-400">
                                        {getComplianceRuleTriggerSummary(
                                            trigger.ruleName,
                                            trigger.threshold,
                                            trigger.observed,
                                        )}
                                    </p>
                                    {trigger.sourceEventId ? <p>Event: {trigger.sourceEventId}</p> : null}
                                    {trigger.sourceTxHash ? <p>Tx: {trigger.sourceTxHash}</p> : null}
                                    <details className="mt-1">
                                        <summary className="cursor-pointer text-gray-400">Threshold / observed</summary>
                                        <pre className="mt-1 overflow-x-auto whitespace-pre-wrap rounded bg-black/30 p-2 text-[11px] text-gray-300">
                                            {formatJson({ threshold: trigger.threshold, observed: trigger.observed })}
                                        </pre>
                                    </details>
                                </div>
                            ))}
                        </div>
                    )}

                    {caseItem.evidence ? (
                        <details className="mt-3 rounded-md border border-white/10 bg-black/20 p-3 text-xs text-gray-300">
                            <summary className="cursor-pointer uppercase tracking-[0.18em] text-[#00f2ff]">
                                Case evidence metadata
                            </summary>
                            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded bg-black/30 p-2 text-[11px] text-gray-300">
                                {formatJson(caseItem.evidence)}
                            </pre>
                        </details>
                    ) : null}
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
                            disabled={!caseItem.account?.vcMetadata?.vcHash}
                            className="rounded bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Revoke VC
                        </button>
                    </div>
                )}
            </div>
        </div>

    )
}