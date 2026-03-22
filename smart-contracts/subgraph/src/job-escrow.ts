// Handlers for JobEscrow contract events to update the subgraph entities accordingly
import {
  FundsReleased,
  JobAccepted,
  JobCancelled,
  JobCreated,
  ReleaseRequested,
} from "../generated/JobEscrow/JobEscrow";
import { Address, BigInt } from "@graphprotocol/graph-ts";

import {
  STATE_FUNDED,
  STATE_IN_PROGRESS,
  STATE_PENDING_APPROVAL,
  STATE_COMPLETED,
  STATE_CANCELLED,
  EVENT_JOB_CREATED,
  EVENT_JOB_ACCEPTED,
  EVENT_RELEASE_REQUESTED,
  EVENT_FUNDS_RELEASED,
  EVENT_JOB_CANCELLED,
} from "../utils/constants";
import { getOrCreateJob, saveEscrowEvent } from "../utils/event-utils";

// Event handlers for the JobEscrow contract
export function handleJobCreated(event: JobCreated): void {
  const job = getOrCreateJob(
    event.params.jobId,
    event,
    event.params.employer,
    event.params.amount,
  );

  job.employer = event.params.employer;
  job.amount = event.params.amount;
  job.state = STATE_FUNDED;
  job.updatedAt = event.block.timestamp;
  job.updatedBlockNumber = event.block.number;
  job.save();

  saveEscrowEvent(
    event,
    event.params.jobId,
    EVENT_JOB_CREATED,
    event.params.employer,
    null,
    event.params.amount,
  );
}

// Event handler for when a job is accepted by a worker
export function handleJobAccepted(event: JobAccepted): void {
  const job = getOrCreateJob(event.params.jobId, event);

  job.worker = event.params.worker;
  job.state = STATE_IN_PROGRESS;
  job.updatedAt = event.block.timestamp;
  job.updatedBlockNumber = event.block.number;
  job.save();

  saveEscrowEvent(
    event,
    event.params.jobId,
    EVENT_JOB_ACCEPTED,
    event.params.worker,
    Address.fromBytes(job.employer),
    job.amount,
  );
}

// Event handler for when a release is requested by the worker
export function handleReleaseRequested(event: ReleaseRequested): void {
  const job = getOrCreateJob(event.params.jobId, event);

  job.state = STATE_PENDING_APPROVAL;
  job.updatedAt = event.block.timestamp;
  job.updatedBlockNumber = event.block.number;
  job.save();

  saveEscrowEvent(
    event,
    event.params.jobId,
    EVENT_RELEASE_REQUESTED,
    null,
    Address.fromBytes(job.employer),
    job.amount,
  );
}

// Event handler for when funds are released, either to the worker or back to the employer
export function handleFundsReleased(event: FundsReleased): void {
  const job = getOrCreateJob(event.params.jobId, event);

  const releasedToWorker = job.state != STATE_FUNDED;

  if (releasedToWorker) {
    job.state = STATE_COMPLETED;
    job.releasedAt = event.block.timestamp;
  } else {
    job.state = STATE_CANCELLED;
    job.cancelledAt = event.block.timestamp;
  }

  job.amount = BigInt.zero();
  job.updatedAt = event.block.timestamp;
  job.updatedBlockNumber = event.block.number;
  job.save();

  const counterparty = releasedToWorker
    ? Address.fromBytes(job.employer)
    : null;

  saveEscrowEvent(
    event,
    event.params.jobId,
    EVENT_FUNDS_RELEASED,
    event.params.worker,
    counterparty,
    event.params.amount,
  );
}

// Event handler for when a job is cancelled by the employer
export function handleJobCancelled(event: JobCancelled): void {
  const job = getOrCreateJob(event.params.jobId, event);

  job.state = STATE_CANCELLED;
  job.cancelledAt = event.block.timestamp;
  job.updatedAt = event.block.timestamp;
  job.updatedBlockNumber = event.block.number;
  job.save();

  saveEscrowEvent(
    event,
    event.params.jobId,
    EVENT_JOB_CANCELLED,
    Address.fromBytes(job.employer),
    null,
    null,
  );
}
