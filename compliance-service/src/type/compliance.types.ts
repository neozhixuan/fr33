// Escrow event metadata types
export type EscrowEventTypes =
  | "JOB_CREATED"
  | "JOB_ACCEPTED"
  | "RELEASE_REQUESTED"
  | "FUNDS_RELEASED"
  | "JOB_CANCELLED";

type EscrowEventProperties = {
  id: string;
  jobId: string;
  eventType: EscrowEventTypes;
  blockNumber: bigint;
  blockTimestamp: Date;
  logIndex: number;
};

export type SubgraphEscrowEvent = {
  wallet: string | null;
  counterparty: string | null;
  amount: string | null;
  transactionHash: string;
} & EscrowEventProperties;

export type EscrowActivityRecord = {
  sourceEventId: string;
  walletAddress: string | null;
  counterpartyAddress: string | null;
  amountWei: string | null;
  txHash: string;
  createdAt: Date;
} & EscrowEventProperties;

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
