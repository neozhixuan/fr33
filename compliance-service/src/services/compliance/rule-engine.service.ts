import {
  countWalletEventsSince,
  getWalletCreatedEscrowActivities,
} from "../../model/escrow-activity.repository";
import { getComplianceConfig } from "../../config/compliance.config";
import {
  EscrowActivityRecord,
  RuleEvaluationCandidate,
} from "../../type/compliance.types";
import {
  subtractHours,
  subtractMinutes,
  sumBigInt,
  toBigInt,
} from "../../utils/conv";

// Function to generate a unique fingerprint for a rule trigger based on the rule name, wallet address, and source event ID.
// This helps prevent duplicate triggers for the same event.
function getFingerprint(
  ruleName: string,
  walletAddress: string,
  sourceEventId: string,
): string {
  return `${ruleName}:${walletAddress.toLowerCase()}:${sourceEventId}`;
}

// Main function
// Evaluates compliance rules for a given wallet event, returning any triggered rules with details for further processing.
export async function evaluateRulesForWalletEvent(
  walletAddress: string,
  activity: EscrowActivityRecord,
): Promise<RuleEvaluationCandidate[]> {
  const config = getComplianceConfig();
  const triggered: RuleEvaluationCandidate[] = [];

  if (activity.eventType === "JOB_CREATED" && activity.amountWei) {
    const lookbackStart = subtractHours(
      activity.blockTimestamp,
      config.largeEscrow.lookbackHours,
    );

    const historical = await getWalletCreatedEscrowActivities(
      walletAddress,
      lookbackStart,
      activity.blockTimestamp,
    );

    if (historical.length >= config.largeEscrow.minBaselineTxCount) {
      const baselineValues = historical.map((row) => toBigInt(row.amountWei));
      const baselineAverageWei =
        sumBigInt(baselineValues) / BigInt(baselineValues.length);

      const currentAmountWei = toBigInt(activity.amountWei);
      const dynamicThresholdWei = BigInt(
        Math.floor(Number(baselineAverageWei) * config.largeEscrow.multiplier),
      );
      const thresholdWei =
        dynamicThresholdWei > config.largeEscrow.absoluteMinWei
          ? dynamicThresholdWei
          : config.largeEscrow.absoluteMinWei;

      if (currentAmountWei > thresholdWei) {
        triggered.push({
          ruleName: "LARGE_ESCROW_ANOMALY",
          scoreDelta: config.largeEscrow.scoreDelta,
          threshold: {
            multiplier: config.largeEscrow.multiplier,
            baselineTxCount: historical.length,
            absoluteMinWei: config.largeEscrow.absoluteMinWei.toString(),
            thresholdWei: thresholdWei.toString(),
          },
          observed: {
            currentAmountWei: currentAmountWei.toString(),
            baselineAverageWei: baselineAverageWei.toString(),
            lookbackHours: config.largeEscrow.lookbackHours,
          },
          fingerprint: getFingerprint(
            "LARGE_ESCROW_ANOMALY",
            walletAddress,
            activity.sourceEventId,
          ),
          sourceEventId: activity.sourceEventId,
          sourceTxHash: activity.txHash,
        });
      }
    }
  }

  if (activity.eventType === "JOB_CANCELLED") {
    const disputeWindowStart = subtractHours(
      activity.blockTimestamp,
      config.disputeFrequency.lookbackHours,
    );

    const createdCount = await countWalletEventsSince(
      walletAddress,
      disputeWindowStart,
      ["JOB_CREATED"],
    );

    const cancelledCount = await countWalletEventsSince(
      walletAddress,
      disputeWindowStart,
      ["JOB_CANCELLED"],
    );

    if (createdCount >= config.disputeFrequency.minJobs && createdCount > 0) {
      const ratio = cancelledCount / createdCount;

      if (ratio >= config.disputeFrequency.disputeRatioThreshold) {
        triggered.push({
          ruleName: "HIGH_DISPUTE_FREQUENCY",
          scoreDelta: config.disputeFrequency.scoreDelta,
          threshold: {
            disputeRatioThreshold:
              config.disputeFrequency.disputeRatioThreshold,
            minJobs: config.disputeFrequency.minJobs,
            lookbackHours: config.disputeFrequency.lookbackHours,
          },
          observed: {
            createdCount,
            cancelledCount,
            ratio,
          },
          fingerprint: getFingerprint(
            "HIGH_DISPUTE_FREQUENCY",
            walletAddress,
            activity.sourceEventId,
          ),
          sourceEventId: activity.sourceEventId,
          sourceTxHash: activity.txHash,
        });
      }
    }
  }

  const burstWindowStart = subtractMinutes(
    activity.blockTimestamp,
    config.burstActivity.windowMinutes,
  );

  const burstCount = await countWalletEventsSince(
    walletAddress,
    burstWindowStart,
    [
      "JOB_CREATED",
      "JOB_ACCEPTED",
      "RELEASE_REQUESTED",
      "FUNDS_RELEASED",
      "JOB_CANCELLED",
    ],
  );

  if (burstCount >= config.burstActivity.minEventCount) {
    triggered.push({
      ruleName: "BURST_ACTIVITY",
      scoreDelta: config.burstActivity.scoreDelta,
      threshold: {
        minEventCount: config.burstActivity.minEventCount,
        windowMinutes: config.burstActivity.windowMinutes,
      },
      observed: {
        eventCount: burstCount,
      },
      fingerprint: getFingerprint(
        "BURST_ACTIVITY",
        walletAddress,
        activity.sourceEventId,
      ),
      sourceEventId: activity.sourceEventId,
      sourceTxHash: activity.txHash,
    });
  }

  return triggered;
}
