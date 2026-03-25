type RuleMetadata = {
  description: string;
};

const RULE_METADATA: Record<string, RuleMetadata> = {
  LARGE_ESCROW_ANOMALY: {
    description:
      "Flags an unusually large new escrow amount compared to the wallet's historical baseline.",
  },
  HIGH_DISPUTE_FREQUENCY: {
    description:
      "Flags wallets with a high cancellation/dispute rate over recent job activity.",
  },
  BURST_ACTIVITY: {
    description:
      "Flags short bursts of many escrow lifecycle events in a tight time window.",
  },
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export function getComplianceRuleDescription(ruleName: string): string {
  return (
    RULE_METADATA[ruleName]?.description ||
    "Flags potentially suspicious behavior based on configured compliance thresholds."
  );
}

export function getComplianceRuleTriggerSummary(
  ruleName: string,
  threshold: unknown,
  observed: unknown,
): string {
  const t = asRecord(threshold);
  const o = asRecord(observed);

  if (ruleName === "BURST_ACTIVITY") {
    const eventCount = toNumber(o?.eventCount);
    const minEventCount = toNumber(t?.minEventCount);
    const windowMinutes = toNumber(t?.windowMinutes);

    if (
      eventCount !== null &&
      minEventCount !== null &&
      windowMinutes !== null
    ) {
      return `Triggered because ${eventCount} events were detected in ${windowMinutes} minutes (threshold: ${minEventCount}+).`;
    }
  }

  if (ruleName === "HIGH_DISPUTE_FREQUENCY") {
    const createdCount = toNumber(o?.createdCount);
    const cancelledCount = toNumber(o?.cancelledCount);
    const ratio = toNumber(o?.ratio);
    const ratioThreshold = toNumber(t?.disputeRatioThreshold);
    const lookbackHours = toNumber(t?.lookbackHours);

    if (
      createdCount !== null &&
      cancelledCount !== null &&
      ratio !== null &&
      ratioThreshold !== null &&
      lookbackHours !== null
    ) {
      return `Triggered because dispute ratio ${ratio.toFixed(
        2,
      )} (${cancelledCount}/${createdCount}) met or exceeded ${ratioThreshold.toFixed(
        2,
      )} over ${lookbackHours}h.`;
    }
  }

  if (ruleName === "LARGE_ESCROW_ANOMALY") {
    const currentAmountWei = toNumber(o?.currentAmountWei);
    const thresholdWei = toNumber(t?.thresholdWei);
    const multiplier = toNumber(t?.multiplier);
    const lookbackHours = toNumber(o?.lookbackHours);

    if (
      currentAmountWei !== null &&
      thresholdWei !== null &&
      multiplier !== null &&
      lookbackHours !== null
    ) {
      return `Triggered because escrow amount (${currentAmountWei}) exceeded dynamic threshold (${thresholdWei}) using ${multiplier}x baseline over ${lookbackHours}h.`;
    }
  }

  return "Triggered when observed behavior exceeds the configured threshold for this rule.";
}
