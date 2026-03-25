import { getComplianceConfig } from "../../config/compliance.config";
import {
  createComplianceCase,
  getOpenCase,
} from "../../model/compliance-case.repository";
import {
  getOrCreateProfile,
  incrementProfileScore,
} from "../../model/compliance.repository";
import {
  attachTriggersToCase,
  createRuleTriggerIfMissing,
} from "../../model/rule-trigger.repository";
import { evaluateRulesForWalletEvent } from "./rule-engine.service";
import { logVerbose } from "./monitor.service";

// Process wallet activity, evaluate rules, create rule triggers, update profile score, and open compliance case if threshold exceeded
export async function processWalletRules(
  walletAddress: string,
  activity: {
    sourceEventId: string;
    txHash: string;
    blockTimestamp: Date;
    eventType:
      | "JOB_CREATED"
      | "JOB_ACCEPTED"
      | "RELEASE_REQUESTED"
      | "FUNDS_RELEASED"
      | "JOB_CANCELLED";
    amountWei: string | null;
  },
): Promise<void> {
  const profile = await getOrCreateProfile(walletAddress);
  const ruleCandidates = await evaluateRulesForWalletEvent(
    walletAddress,
    activity as any,
  );

  if (!ruleCandidates.length) {
    return;
  }

  const createdTriggers: any[] = [];

  for (const candidate of ruleCandidates) {
    const created = await createRuleTriggerIfMissing(profile.id, candidate);
    if (created) {
      createdTriggers.push(created);
    }
  }

  if (!createdTriggers.length) {
    logVerbose(
      `Rule candidates were duplicates for wallet ${walletAddress} on event ${activity.sourceEventId}`,
    );
    return;
  }

  logVerbose(
    `Created ${createdTriggers.length} rule trigger(s) for wallet ${walletAddress}`,
  );

  const scoreDelta = createdTriggers.reduce(
    (acc, trigger) => acc + Number(trigger.scoreDelta),
    0,
  );

  const updatedProfile = await incrementProfileScore(
    profile.id,
    scoreDelta,
    activity.blockTimestamp,
  );

  const config = getComplianceConfig();
  const openCase = await getOpenCase(profile.id);
  const triggerIds = createdTriggers.map((trigger) => trigger.id as number);

  if (openCase) {
    await attachTriggersToCase(openCase.id, triggerIds);
    return;
  }

  if (Number(updatedProfile.cumulativeScore) < config.caseThreshold) {
    return;
  }

  const triggeredRules = createdTriggers.map((trigger) =>
    String(trigger.ruleName),
  );

  const evidence = {
    walletAddress,
    sourceEventId: activity.sourceEventId,
    sourceTxHash: activity.txHash,
    triggeredRules,
    triggerIds,
    triggeredAt: activity.blockTimestamp.toISOString(),
  };

  await createComplianceCase({
    profileId: profile.id,
    scoreAtCreation: Number(updatedProfile.cumulativeScore),
    triggeredRules,
    evidence,
    triggerIds,
  });

  console.log(
    `[compliance-monitor] Opened compliance case for ${walletAddress} with score ${updatedProfile.cumulativeScore}`,
  );
}
