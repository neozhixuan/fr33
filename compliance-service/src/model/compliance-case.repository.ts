import { prisma } from "../lib/db";

type Db = typeof prisma & Record<string, any>;
const db = prisma as Db;

// REPO: Dismiss a compliance case with notes, and return the updated case with related profile and triggers
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

// REPO: Action a compliance case with a txHash and notes, and return the updated case with related profile and triggers
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

// REPO: Update a job after approving fund release with the transaction hash
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

// REPO: Get an open compliance case for a profile, if it exists
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

// REPO: Create a compliance case for a profile with triggered rules and evidence, and connect it to the related rule triggers
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
