import { RuleEvaluationCandidate } from "../type/compliance.types";
import { prisma } from "../lib/db";

type Db = typeof prisma & Record<string, any>;
const db = prisma as Db;

// REPO: Create a rule trigger if it doesn't exist based on a unique fingerprint, and return whether it was created along with the record
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

// REPO: Attach rule triggers to a compliance case
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
