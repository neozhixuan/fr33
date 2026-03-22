import { fetchEscrowEventsAfter } from "./subgraph.client";
import {
  attachTriggersToCase,
  createComplianceCase,
  createRuleTriggerIfMissing,
  getOpenCase,
  getOrCreateCursor,
  getOrCreateProfile,
  incrementProfileScore,
  ingestEscrowEvent,
  updateCursor,
} from "./compliance.repository";
import { evaluateRulesForWalletEvent } from "./rule-engine.service";
import { getComplianceConfig } from "./compliance.config";

let timer: NodeJS.Timeout | null = null;
let polling = false;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function logVerbose(message: string): void {
  const config = getComplianceConfig();
  if (!config.monitorVerbose) return;
  console.log(`[compliance-monitor] ${message}`);
}

function extractWalletCandidates(activity: {
  walletAddress: string | null;
  counterpartyAddress: string | null;
}): string[] {
  const wallets = new Set<string>();

  if (activity.walletAddress) {
    const normalized = activity.walletAddress.toLowerCase();
    if (normalized !== ZERO_ADDRESS) wallets.add(normalized);
  }

  if (activity.counterpartyAddress) {
    const normalized = activity.counterpartyAddress.toLowerCase();
    if (normalized !== ZERO_ADDRESS) wallets.add(normalized);
  }

  return Array.from(wallets);
}

async function processWalletRules(
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

export async function pollComplianceEventsOnce(): Promise<void> {
  if (polling) {
    return;
  }

  polling = true;

  try {
    const lastProcessed = await getOrCreateCursor();
    const fromTimestampSec = lastProcessed
      ? Math.floor(lastProcessed.getTime() / 1000)
      : 0;

    logVerbose(
      `Polling subgraph from timestamp ${fromTimestampSec} (${
        lastProcessed ? lastProcessed.toISOString() : "initial sync"
      })`,
    );

    const events = await fetchEscrowEventsAfter(fromTimestampSec);

    logVerbose(`Fetched ${events.length} escrow event(s) from subgraph`);

    if (!events.length) {
      return;
    }

    let newestTimestamp = lastProcessed || new Date(0);
    let ingestedCount = 0;

    for (const event of events) {
      const { created, activity } = await ingestEscrowEvent(event);

      if (!created || !activity) {
        continue;
      }

      ingestedCount++;

      const walletsToEvaluate = extractWalletCandidates(activity);

      for (const walletAddress of walletsToEvaluate) {
        await processWalletRules(walletAddress, activity);
      }

      if (activity.blockTimestamp > newestTimestamp) {
        newestTimestamp = activity.blockTimestamp;
      }
    }

    await updateCursor(newestTimestamp);
    logVerbose(
      `Ingested ${ingestedCount} new event(s). Cursor moved to ${newestTimestamp.toISOString()}`,
    );
  } catch (error) {
    console.error(
      "[compliance-monitor] Poll failed:",
      (error as Error).message,
    );
  } finally {
    polling = false;
  }
}

export function startComplianceMonitor(): void {
  const config = getComplianceConfig();

  if (!config.monitorEnabled) {
    console.log("[compliance-monitor] Disabled via COMPLIANCE_MONITOR_ENABLED");
    return;
  }

  if (!config.subgraphUrl) {
    console.warn(
      "[compliance-monitor] COMPLIANCE_SUBGRAPH_URL missing; monitor not started.",
    );
    return;
  }

  if (timer) {
    return;
  }

  console.log(
    `[compliance-monitor] Starting with interval ${config.pollIntervalMs}ms`,
  );

  pollComplianceEventsOnce();

  timer = setInterval(() => {
    pollComplianceEventsOnce();
  }, config.pollIntervalMs);
}

export function stopComplianceMonitor(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
