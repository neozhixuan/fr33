import { ComplianceConfig } from "../type/compliance.types";

// Get env variable that has dtype of number
function getEnvNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
}

// Get env variable that has dtype of bigint
function getEnvBigInt(name: string, fallback: bigint): bigint {
  const raw = process.env[name];
  if (!raw) return fallback;

  try {
    return BigInt(raw);
  } catch {
    return fallback;
  }
}

// Get env variable that has dtype of boolean
function getEnvBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (!raw) return fallback;
  return ["true", "1", "yes", "y"].includes(raw.toLowerCase());
}

// Get configurations for compliance in runtime
export function getComplianceConfig(): ComplianceConfig {
  return {
    monitorEnabled: getEnvBool("COMPLIANCE_MONITOR_ENABLED", true),
    monitorVerbose: getEnvBool("COMPLIANCE_MONITOR_VERBOSE", true),
    subgraphUrl: process.env.COMPLIANCE_SUBGRAPH_URL || "",
    pollIntervalMs: getEnvNumber("COMPLIANCE_POLL_INTERVAL_MS", 30_000),
    fetchBatchSize: getEnvNumber("COMPLIANCE_FETCH_BATCH_SIZE", 200),
    caseThreshold: getEnvNumber("COMPLIANCE_CASE_THRESHOLD", 100),
    largeEscrow: {
      minBaselineTxCount: getEnvNumber(
        "COMPLIANCE_LARGE_ESCROW_MIN_BASELINE_TX",
        3,
      ),
      lookbackHours: getEnvNumber(
        "COMPLIANCE_LARGE_ESCROW_LOOKBACK_HOURS",
        168,
      ),
      multiplier: getEnvNumber("COMPLIANCE_LARGE_ESCROW_MULTIPLIER", 3),
      absoluteMinWei: getEnvBigInt(
        "COMPLIANCE_LARGE_ESCROW_ABS_MIN_WEI",
        50_000_000_000_000_000n,
      ),
      scoreDelta: getEnvNumber("COMPLIANCE_LARGE_ESCROW_SCORE", 40),
    },
    disputeFrequency: {
      lookbackHours: getEnvNumber("COMPLIANCE_DISPUTE_LOOKBACK_HOURS", 168),
      minJobs: getEnvNumber("COMPLIANCE_DISPUTE_MIN_JOBS", 3),
      disputeRatioThreshold: getEnvNumber(
        "COMPLIANCE_DISPUTE_RATIO_THRESHOLD",
        0.4,
      ),
      scoreDelta: getEnvNumber("COMPLIANCE_DISPUTE_SCORE", 45),
    },
    burstActivity: {
      windowMinutes: getEnvNumber("COMPLIANCE_BURST_WINDOW_MINUTES", 30),
      minEventCount: getEnvNumber("COMPLIANCE_BURST_MIN_EVENT_COUNT", 4),
      scoreDelta: getEnvNumber("COMPLIANCE_BURST_SCORE", 30),
    },
  };
}
