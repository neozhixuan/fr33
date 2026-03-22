export type SubgraphEscrowEvent = {
  id: string;
  jobId: string;
  eventType:
    | "JOB_CREATED"
    | "JOB_ACCEPTED"
    | "RELEASE_REQUESTED"
    | "FUNDS_RELEASED"
    | "JOB_CANCELLED";
  wallet: string | null;
  counterparty: string | null;
  amount: string | null;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
  logIndex: string;
};

export type EscrowActivityRecord = {
  id: number;
  sourceEventId: string;
  jobId: bigint;
  eventType:
    | "JOB_CREATED"
    | "JOB_ACCEPTED"
    | "RELEASE_REQUESTED"
    | "FUNDS_RELEASED"
    | "JOB_CANCELLED";
  walletAddress: string | null;
  counterpartyAddress: string | null;
  amountWei: string | null;
  blockNumber: bigint;
  blockTimestamp: Date;
  txHash: string;
  logIndex: number;
};

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
