// Escrow event metadata types
export type EscrowEventTypes =
  | "JOB_CREATED"
  | "JOB_ACCEPTED"
  | "RELEASE_REQUESTED"
  | "FUNDS_RELEASED"
  | "JOB_CANCELLED";

type EscrowEventCommonProperties = {
  eventType: EscrowEventTypes;
  blockNumber: bigint;
  blockTimestamp: Date;
  logIndex: number;
};

export type SubgraphEscrowEvent = {
  id: string;
  jobId: string;
  wallet: string | null;
  counterparty: string | null;
  amount: string | null;
  transactionHash: string;
} & EscrowEventCommonProperties;

export type EscrowActivityRecord = {
  id: number;
  jobId: bigint;
  sourceEventId: string;
  walletAddress: string | null;
  counterpartyAddress: string | null;
  amountWei: string | null;
  txHash: string;
  createdAt: Date;
} & EscrowEventCommonProperties;

// Compliance types
export type RuleEvaluationCandidate = {
  ruleName:
    | "LARGE_ESCROW_ANOMALY"
    | "HIGH_DISPUTE_FREQUENCY"
    | "BURST_ACTIVITY";
  scoreDelta: number;
  threshold: Record<string, unknown>;
  observed: Record<string, unknown>;
  fingerprint: string;
  sourceEventId: string;
  sourceTxHash: string;
};

export type ComplianceConfig = {
  monitorEnabled: boolean;
  monitorVerbose: boolean;
  subgraphUrl: string;
  pollIntervalMs: number;
  fetchBatchSize: number;
  caseThreshold: number;
  largeEscrow: {
    minBaselineTxCount: number;
    lookbackHours: number;
    multiplier: number;
    absoluteMinWei: bigint;
    scoreDelta: number;
  };
  disputeFrequency: {
    lookbackHours: number;
    minJobs: number;
    disputeRatioThreshold: number;
    scoreDelta: number;
  };
  burstActivity: {
    windowMinutes: number;
    minEventCount: number;
    scoreDelta: number;
  };
};
