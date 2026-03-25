'use client';

import { ComplianceCase } from '@/type/complianceTypes';
import {
    getComplianceRuleDescription,
    getComplianceRuleTriggerSummary,
} from '@/utils/complianceRuleMetadata';

type RuleStats = {
    ruleName: string;
    count: number;
    totalDelta: number;
    latestThreshold: unknown;
    latestObserved: unknown;
};

interface ComplianceScoringCriteriaProps {
    cases: ComplianceCase[];
}

export default function ComplianceScoringCriteria({ cases }: ComplianceScoringCriteriaProps) {
    const triggerList = cases.flatMap((c) => c.ruleTriggers ?? []);

    const statsMap = triggerList.reduce<Map<string, RuleStats>>((map, trigger) => {
        const current = map.get(trigger.ruleName);
        if (!current) {
            map.set(trigger.ruleName, {
                ruleName: trigger.ruleName,
                count: 1,
                totalDelta: trigger.scoreDelta,
                latestThreshold: trigger.threshold,
                latestObserved: trigger.observed,
            });
            return map;
        }

        current.count += 1;
        current.totalDelta += trigger.scoreDelta;
        current.latestThreshold = trigger.threshold;
        current.latestObserved = trigger.observed;
        map.set(trigger.ruleName, current);
        return map;
    }, new Map());

    const ruleStats = Array.from(statsMap.values()).sort((a, b) => b.count - a.count);

    const formatJson = (value: unknown) => {
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return String(value);
        }
    };

    return (
        <section className="rounded-lg border border-white/10 bg-[#131314]/60 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#00f2ff]">
                Scoring Criteria (from indexed rule triggers)
            </h2>
            <p className="mt-2 text-xs text-gray-400">
                Derived from existing trigger metadata. No extra scoring logic applied.
            </p>

            {ruleStats.length === 0 ? (
                <p className="mt-4 text-sm text-gray-400">No rule-trigger metadata available yet.</p>
            ) : (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {ruleStats.map((rule) => (
                        <article key={rule.ruleName} className="rounded-md border border-white/10 bg-black/20 p-3">
                            <p className="text-xs uppercase tracking-[0.16em] text-[#e5e2e3]">{rule.ruleName}</p>
                            <p className="mt-1 text-xs text-gray-400">{getComplianceRuleDescription(rule.ruleName)}</p>
                            <p className="mt-1 text-sm text-gray-300">
                                Triggered <span className="font-semibold text-white">{rule.count}</span> times
                            </p>
                            <p className="text-sm text-gray-300">
                                Total score delta: <span className="font-semibold text-red-300">+{rule.totalDelta}</span>
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                                {getComplianceRuleTriggerSummary(
                                    rule.ruleName,
                                    rule.latestThreshold,
                                    rule.latestObserved,
                                )}
                            </p>
                            <details className="mt-2">
                                <summary className="cursor-pointer text-xs text-gray-400">Latest threshold / observed metadata</summary>
                                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded bg-black/30 p-2 text-[11px] text-gray-300">
                                    {formatJson({ threshold: rule.latestThreshold, observed: rule.latestObserved })}
                                </pre>
                            </details>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
