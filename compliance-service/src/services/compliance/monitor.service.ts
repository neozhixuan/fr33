import { fetchEscrowEventsAfter } from "./subgraph.client";
import { getComplianceConfig } from "../../config/compliance.config";

// Models
import {
  getOrCreateCursor,
  updateCursor,
} from "../../model/compliance.repository";
import { ingestEscrowEvent } from "../../model/escrow-activity.repository";
import { processWalletRules } from "./rule-processor.service";

let timer: NodeJS.Timeout | null = null;
let polling = false;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// Log verbosely if monitorVerbose is enabled, otherwise do nothing
export function logVerbose(message: string): void {
  const config = getComplianceConfig();
  if (!config.monitorVerbose) return;
  console.log(`[compliance-monitor] ${message}`);
}

// Extract normalised wallet addresses from an escrow activity
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

// Poll the subgraph for new escrow events, ingest them, evaluate rules, and update compliance profiles and cases accordingly.
// Uses a cursor to track the last processed event timestamp.
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

// Start the compliance monitor, which polls for new events at a configured interval and processes them
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

// Stop the compliance monitor and clear the polling timer
export function stopComplianceMonitor(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
