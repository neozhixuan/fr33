// Utility functions for handling events in the subgraph
import { EscrowEvent, Job } from "../generated/schema";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { STATE_FUNDED } from "./constants";

function getEventId(event: ethereum.Event): string {
  return event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
}

function getJobId(jobId: BigInt): string {
  return jobId.toString();
}

// Utility function to get or create a Job entity based on the jobId and event data
export function saveEscrowEvent(
  event: ethereum.Event,
  jobId: BigInt,
  eventType: string,
  wallet: Address | null,
  counterparty: Address | null,
  amount: BigInt | null,
): void {
  const escrowEvent = new EscrowEvent(getEventId(event));
  escrowEvent.job = getJobId(jobId);
  escrowEvent.jobId = jobId;
  escrowEvent.eventType = eventType;
  escrowEvent.wallet = wallet;
  escrowEvent.counterparty = counterparty;
  escrowEvent.amount = amount;
  escrowEvent.blockNumber = event.block.number;
  escrowEvent.blockTimestamp = event.block.timestamp;
  escrowEvent.transactionHash = event.transaction.hash;
  escrowEvent.logIndex = event.logIndex;
  escrowEvent.save();
}

// Utility functions for creating or updating Job entities based on events
export function getOrCreateJob(
  jobId: BigInt,
  event: ethereum.Event,
  employer: Address | null = null,
  amount: BigInt | null = null,
): Job {
  const id = getJobId(jobId);
  let job = Job.load(id);

  if (job == null) {
    job = new Job(id);
    job.jobId = jobId;
    job.employer = employer ? employer : Address.zero();
    job.worker = null;
    job.amount = amount ? amount : BigInt.zero();
    job.state = STATE_FUNDED;
    job.createdAt = event.block.timestamp;
    job.createdTxHash = event.transaction.hash;
    job.createdBlockNumber = event.block.number;
    job.updatedAt = event.block.timestamp;
    job.updatedBlockNumber = event.block.number;
    job.releasedAt = null;
    job.cancelledAt = null;
  }

  return job as Job;
}
