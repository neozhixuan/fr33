import { prisma } from "../../lib/db";
import {
  EscrowActivityRecord,
  RuleEvaluationCandidate,
  SubgraphEscrowEvent,
} from "./compliance.types";

type Db = typeof prisma & Record<string, any>;

const db = prisma as Db;

const INGESTION_CURSOR_ID = 1;

function normalizeWallet(wallet: string | null): string | null {
  if (!wallet) return null;
  return wallet.toLowerCase();
}

export async function getOrCreateCursor(): Promise<Date | null> {
  const cursor = await db.complianceIngestionCursor.upsert({
    where: { id: INGESTION_CURSOR_ID },
    create: { id: INGESTION_CURSOR_ID, lastProcessedTimestamp: null },
    update: {},
  });

  return cursor.lastProcessedTimestamp as Date | null;
}

export async function updateCursor(
  lastProcessedTimestamp: Date,
): Promise<void> {
  await db.complianceIngestionCursor.upsert({
    where: { id: INGESTION_CURSOR_ID },
    create: {
      id: INGESTION_CURSOR_ID,
      lastProcessedTimestamp,
    },
    update: {
      lastProcessedTimestamp,
    },
  });
}

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
      walletAddress: normalizeWallet(event.wallet),
      counterpartyAddress: normalizeWallet(event.counterparty),
      amountWei: event.amount,
      blockNumber: BigInt(event.blockNumber),
      blockTimestamp: new Date(Number(event.blockTimestamp) * 1000),
      txHash: event.transactionHash,
      logIndex: Number(event.logIndex),
    },
  });

  return { created: true, activity: created as EscrowActivityRecord };
}

export async function getOrCreateProfile(walletAddress: string): Promise<any> {
  return db.complianceProfile.upsert({
    where: {
      walletAddress: walletAddress.toLowerCase(),
    },
    create: {
      walletAddress: walletAddress.toLowerCase(),
      cumulativeScore: 0,
    },
    update: {},
  });
}

export async function incrementProfileScore(
  profileId: number,
  scoreDelta: number,
  triggeredAt: Date,
): Promise<any> {
  return db.complianceProfile.update({
    where: { id: profileId },
    data: {
      cumulativeScore: {
        increment: scoreDelta,
      },
      lastTriggeredAt: triggeredAt,
    },
  });
}

export async function getProfileByWallet(walletAddress: string): Promise<any> {
  return db.complianceProfile.findUnique({
    where: {
      walletAddress: walletAddress.toLowerCase(),
    },
    include: {
      ruleTriggers: {
        orderBy: {
          triggeredAt: "desc",
        },
        take: 25,
      },
      complianceCases: {
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
    },
  });
}

export async function createRuleTriggerIfMissing(
  profileId: number,
  candidate: RuleEvaluationCandidate,
): Promise<any | null> {
  const existing = await db.complianceRuleTrigger.findUnique({
    where: {
      fingerprint: candidate.fingerprint,
    },
  });

  if (existing) {
    return null;
  }

  return db.complianceRuleTrigger.create({
    data: {
      profileId,
      ruleName: candidate.ruleName,
      scoreDelta: candidate.scoreDelta,
      threshold: candidate.threshold as any,
      observed: candidate.observed as any,
      sourceEventId: candidate.sourceEventId,
      sourceTxHash: candidate.sourceTxHash,
      fingerprint: candidate.fingerprint,
    },
  });
}

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

export async function getOpenCase(profileId: number): Promise<any | null> {
  return db.complianceCase.findFirst({
    where: {
      profileId,
      status: "OPEN",
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createComplianceCase(params: {
  profileId: number;
  scoreAtCreation: number;
  triggeredRules: string[];
  evidence: Record<string, unknown>;
  triggerIds: number[];
}): Promise<any> {
  return db.complianceCase.create({
    data: {
      profileId: params.profileId,
      scoreAtCreation: params.scoreAtCreation,
      triggeredRules: params.triggeredRules,
      evidence: params.evidence as any,
      ruleTriggers: {
        connect: params.triggerIds.map((id) => ({ id })),
      },
    },
    include: {
      ruleTriggers: true,
      profile: true,
    },
  });
}

export async function attachTriggersToCase(
  caseId: number,
  triggerIds: number[],
): Promise<void> {
  if (!triggerIds.length) return;

  await db.complianceRuleTrigger.updateMany({
    where: {
      id: {
        in: triggerIds,
      },
    },
    data: {
      caseId,
    },
  });
}

export async function listComplianceCases(filters: {
  status?: "OPEN" | "DISMISSED" | "ACTIONED";
  wallet?: string;
}): Promise<any[]> {
  return db.complianceCase.findMany({
    where: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.wallet
        ? {
            profile: {
              walletAddress: filters.wallet.toLowerCase(),
            },
          }
        : {}),
    },
    include: {
      profile: true,
      ruleTriggers: {
        orderBy: {
          triggeredAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function dismissComplianceCase(
  caseId: number,
  notes: string,
): Promise<any> {
  return db.complianceCase.update({
    where: {
      id: caseId,
    },
    data: {
      status: "DISMISSED",
      actionNotes: notes,
      closedAt: new Date(),
    },
    include: {
      profile: true,
      ruleTriggers: true,
    },
  });
}

export async function actionComplianceCase(
  caseId: number,
  txHash: string,
  notes: string,
): Promise<any> {
  return db.complianceCase.update({
    where: {
      id: caseId,
    },
    data: {
      status: "ACTIONED",
      actionTxHash: txHash,
      actionNotes: notes,
      closedAt: new Date(),
    },
    include: {
      profile: true,
      ruleTriggers: true,
    },
  });
}
