import { prisma } from "../lib/db";
import {
  EscrowActivityRecord,
  SubgraphEscrowEvent,
} from "../type/compliance.types";

type Db = typeof prisma & Record<string, any>;
const db = prisma as Db;

export async function countWalletEventsSince(
  walletAddress: string,
  since: Date,
  eventTypes?: string[],
): Promise<number> {
  return db.escrowActivity.count({
    where: {
      walletAddress: walletAddress.toLowerCase(),
      blockTimestamp: {
        gte: since,
      },
      ...(eventTypes?.length
        ? {
            eventType: {
              in: eventTypes as any,
            },
          }
        : {}),
    },
  });
}
export async function getWalletCreatedEscrowActivities(
  walletAddress: string,
  since: Date,
  before: Date,
): Promise<EscrowActivityRecord[]> {
  return db.escrowActivity.findMany({
    where: {
      walletAddress: walletAddress.toLowerCase(),
      eventType: "JOB_CREATED",
      blockTimestamp: {
        gte: since,
        lt: before,
      },
      amountWei: {
        not: null,
      },
    },
    orderBy: {
      blockTimestamp: "asc",
    },
  });
}

// REPO: Ingest an escrow event if it doesn't exist, and return whether it was created along with the record
export async function ingestEscrowEvent(
  event: SubgraphEscrowEvent,
): Promise<{ created: boolean; activity: EscrowActivityRecord | null }> {
  const existing = await db.escrowActivity.findUnique({
    where: { sourceEventId: event.id },
  });

  if (existing) {
    return { created: false, activity: null };
  }

  const created = await db.escrowActivity.create({
    data: {
      sourceEventId: event.id,
      jobId: BigInt(event.jobId),
      eventType: event.eventType,
      walletAddress: normaliseString(event.wallet),
      counterpartyAddress: normaliseString(event.counterparty),
      amountWei: event.amount,
      blockNumber: BigInt(event.blockNumber),
      blockTimestamp: new Date(Number(event.blockTimestamp) * 1000),
      txHash: event.transactionHash,
      logIndex: Number(event.logIndex),
    },
  });

  return { created: true, activity: created as EscrowActivityRecord };
}
