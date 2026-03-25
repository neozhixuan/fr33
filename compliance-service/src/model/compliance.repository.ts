import { prisma } from "../lib/db";
type Db = typeof prisma & Record<string, any>;
const db = prisma as Db;

const INGESTION_CURSOR_ID = 1;

// REPO: Fetch a cursor, else create it
export async function getOrCreateCursor(): Promise<Date | null> {
  const cursor = await db.complianceIngestionCursor.upsert({
    where: { id: INGESTION_CURSOR_ID },
    create: { id: INGESTION_CURSOR_ID, lastProcessedTimestamp: null },
    update: {},
  });

  return cursor.lastProcessedTimestamp as Date | null;
}

// REPO: Update cursor timestamp
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

// REPO: Get the compliance profile of a wallet, creating it if it doesn't exist
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

// REPO: Increment the compliance score of a profile by a delta, and update the last triggered timestamp
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

// REPO: Get a compliance profile by wallet address, including recent rule triggers and cases
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
