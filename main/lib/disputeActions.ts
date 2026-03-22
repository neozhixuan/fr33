"use server";

import { JobStatus, UserRole } from "@/generated/prisma-client";
import { getJobDetails } from "@/model/job";
import {
  addAdminReviewNote,
  addDisputeAuditLog,
  addDisputeEvidence,
  assertDisputeParticipant,
  createDisputeAfterFreeze,
  getDisputeAuditTrail,
  getDisputeByIdBasic,
  getDisputeDetails,
  getTimeoutEligibleJobs,
  getUserDisputeContext,
  hasActiveDisputeForJob,
  listDisputesForUser,
  listOpenDisputes,
  markDisputeOnchainResolutionFailed,
  markDisputeOnchainResolved,
  markDisputeFrozenByAdmin,
  markJobTimeoutAutoReleased,
  setDisputeDecisionPendingOnchain,
} from "@/model/dispute";
import {
  DISPUTE_OUTCOME_TO_CONTRACT_ENUM,
  DisputeEvidenceType,
  DisputeOutcome,
  getFundReleaseTimeoutSeconds,
} from "@/utils/dispute";
import {
  executeAdminEscrowTransaction,
  executeJobTransaction,
} from "@/utils/aaUtils";
import { prisma } from "@/lib/db";

export async function createDisputeAction(params: {
  jobId: number;
  userId: number;
  reason?: string;
}) {
  const { jobId, userId, reason } = params;

  const [job, userContext] = await Promise.all([
    getJobDetails(jobId),
    getUserDisputeContext(userId),
  ]);

  if (!job) {
    throw new Error("Job not found");
  }

  if (!userContext) {
    throw new Error("User not found");
  }

  const isEmployer = job.employerId === userId;
  const isWorker =
    !!job.workerWallet &&
    !!userContext.walletAddress &&
    job.workerWallet.toLowerCase() === userContext.walletAddress.toLowerCase();

  if (!isEmployer && !isWorker) {
    throw new Error(
      "Unauthorized: only job employer or assigned worker can open dispute",
    );
  }

  const allowedDisputeJobStates: JobStatus[] = [
    JobStatus.IN_PROGRESS,
    JobStatus.PENDING_APPROVAL,
  ];
  if (!allowedDisputeJobStates.includes(job.status)) {
    throw new Error(
      `Cannot open dispute for job status ${job.status}. Expected IN_PROGRESS or PENDING_APPROVAL`,
    );
  }

  const existing = await hasActiveDisputeForJob(jobId);
  if (existing) {
    throw new Error("An active dispute already exists for this job");
  }

  const txResult = await executeJobTransaction({
    userId,
    functionName: "openDispute",
    functionArgs: [jobId],
    onSuccess: async (txHash) => {
      await createDisputeAfterFreeze({
        jobId,
        openedByUserId: userId,
        freezeTxHash: txHash,
        reason,
      });
    },
  });

  if (!txResult.success) {
    throw new Error(txResult.errorMsg || "Failed to freeze escrow on-chain");
  }

  const dispute = await getDisputeByJobIdAction(jobId);

  return {
    success: true,
    dispute,
    txHash: txResult.txHash,
    userOpHash: txResult.userOpHash,
  };
}

export async function getDisputeByJobIdAction(jobId: number) {
  const open = await listOpenDisputes();
  return open.find((d) => d.jobId === jobId) ?? null;
}

export async function submitDisputeEvidenceAction(params: {
  disputeId: number;
  userId: number;
  evidenceType: DisputeEvidenceType;
  contentText: string;
  attachmentUrl?: string;
  externalRef?: string;
  idempotencyKey?: string;
}) {
  const {
    disputeId,
    userId,
    evidenceType,
    contentText,
    attachmentUrl,
    externalRef,
    idempotencyKey,
  } = params;

  const userContext = await getUserDisputeContext(userId);
  if (!userContext) {
    throw new Error("User not found");
  }

  const role = await assertDisputeParticipant({ disputeId, userId });
  if (!role) {
    throw new Error("Unable to derive participant role");
  }

  const evidence = await addDisputeEvidence({
    disputeId,
    submittedByUserId: userId,
    submittedByRole: role,
    evidenceType,
    contentText,
    attachmentUrl,
    externalRef,
    idempotencyKey,
  });

  return {
    success: true,
    evidence,
  };
}

export async function listMyDisputesAction(userId: number) {
  return listDisputesForUser(userId);
}

export async function getDisputeDetailsForUserAction(params: {
  disputeId: number;
  userId: number;
  allowAdmin?: boolean;
}) {
  const { disputeId, userId, allowAdmin = false } = params;
  const userContext = await getUserDisputeContext(userId);

  if (!userContext) {
    throw new Error("User not found");
  }

  if (allowAdmin && userContext.role === UserRole.ADMIN) {
    const details = await getDisputeDetails(disputeId);
    if (!details) throw new Error("Dispute not found");
    return details;
  }

  await assertDisputeParticipant({ disputeId, userId });
  const details = await getDisputeDetails(disputeId);
  if (!details) throw new Error("Dispute not found");
  return details;
}

export async function listOpenDisputesAdminAction(adminUserId: number) {
  const userContext = await getUserDisputeContext(adminUserId);
  if (!userContext || userContext.role !== UserRole.ADMIN) {
    throw new Error("Unauthorized: admin access required");
  }

  return listOpenDisputes();
}

export async function addDisputeReviewNoteAction(params: {
  disputeId: number;
  adminUserId: number;
  note: string;
}) {
  const { disputeId, adminUserId, note } = params;
  const userContext = await getUserDisputeContext(adminUserId);

  if (!userContext || userContext.role !== UserRole.ADMIN) {
    throw new Error("Unauthorized: admin access required");
  }

  if (!note.trim()) {
    throw new Error("Review note cannot be empty");
  }

  await addAdminReviewNote({ disputeId, adminUserId, note: note.trim() });

  return { success: true };
}

export async function decideDisputeAction(params: {
  disputeId: number;
  adminUserId: number;
  outcome: DisputeOutcome;
  rationale: string;
  workerShareBps?: number;
}) {
  const { disputeId, adminUserId, outcome, rationale, workerShareBps } = params;

  const userContext = await getUserDisputeContext(adminUserId);
  if (!userContext || userContext.role !== UserRole.ADMIN) {
    throw new Error("Unauthorized: admin access required");
  }

  const dispute = await getDisputeByIdBasic(disputeId);
  if (!dispute) {
    throw new Error("Dispute not found");
  }

  if (
    ![
      "OPEN",
      "EVIDENCE_SUBMISSION",
      "UNDER_REVIEW",
      "DECIDED",
      "ONCHAIN_PENDING",
    ].includes(dispute.status)
  ) {
    throw new Error(`Dispute status ${dispute.status} cannot be decided`);
  }

  if (!rationale.trim()) {
    throw new Error("Decision rationale is required");
  }

  if (outcome === "SPLIT") {
    if (
      workerShareBps === undefined ||
      workerShareBps < 0 ||
      workerShareBps > 10000
    ) {
      throw new Error(
        "workerShareBps must be between 0 and 10000 for SPLIT outcome",
      );
    }
  }

  await setDisputeDecisionPendingOnchain({
    disputeId,
    adminUserId,
    outcome,
    rationale: rationale.trim(),
    workerShareBps: outcome === "SPLIT" ? workerShareBps : null,
  });

  await addDisputeAuditLog({
    disputeId,
    actionType: "ONCHAIN_RESOLUTION_SUBMITTED",
    actorUserId: adminUserId,
    actorRole: UserRole.ADMIN,
    metadata: {
      outcome,
      workerShareBps: outcome === "SPLIT" ? workerShareBps ?? 0 : 0,
    },
  });

  const tx = await executeAdminEscrowTransaction({
    functionName: "resolveDispute",
    functionArgs: [
      dispute.jobId,
      DISPUTE_OUTCOME_TO_CONTRACT_ENUM[outcome],
      BigInt(outcome === "SPLIT" ? workerShareBps ?? 0 : 0),
    ],
  });

  if (!tx.success) {
    await markDisputeOnchainResolutionFailed({
      disputeId,
      errorMsg: tx.errorMsg || "Unknown on-chain error",
    });
    throw new Error(
      tx.errorMsg || "Failed to submit on-chain dispute resolution",
    );
  }

  await markDisputeOnchainResolved({
    disputeId,
    resolutionTxHash: tx.txHash,
    finalJobStatus: JobStatus.COMPLETED,
  });

  return {
    success: true,
    txHash: tx.txHash,
    userOpHash: tx.userOpHash,
  };
}

export async function adminFreezeDisputeEscrowAction(params: {
  disputeId: number;
  adminUserId: number;
}) {
  const { disputeId, adminUserId } = params;
  const userContext = await getUserDisputeContext(adminUserId);
  if (!userContext || userContext.role !== UserRole.ADMIN) {
    throw new Error("Unauthorized: admin access required");
  }

  const dispute = await getDisputeByIdBasic(disputeId);
  if (!dispute) {
    throw new Error("Dispute not found");
  }

  await addDisputeAuditLog({
    disputeId,
    actionType: "ESCROW_FREEZE_REQUESTED",
    actorUserId: adminUserId,
    actorRole: UserRole.ADMIN,
    metadata: { initiatedBy: "admin" },
  });

  const tx = await executeAdminEscrowTransaction({
    functionName: "adminFreezeEscrow",
    functionArgs: [dispute.jobId],
  });

  if (!tx.success) {
    await addDisputeAuditLog({
      disputeId,
      actionType: "ESCROW_FREEZE_FAILED",
      actorUserId: adminUserId,
      actorRole: UserRole.ADMIN,
      metadata: { error: tx.errorMsg || "Unknown error" },
    });
    throw new Error(tx.errorMsg || "Failed to freeze escrow on-chain");
  }

  await markDisputeFrozenByAdmin({
    disputeId,
    adminUserId,
    freezeTxHash: tx.txHash,
  });

  return {
    success: true,
    txHash: tx.txHash,
    userOpHash: tx.userOpHash,
  };
}

export async function getDisputeAuditTrailAction(params: {
  disputeId: number;
  userId: number;
  allowAdmin?: boolean;
}) {
  const { disputeId, userId, allowAdmin = false } = params;
  const userContext = await getUserDisputeContext(userId);
  if (!userContext) {
    throw new Error("User not found");
  }

  if (!(allowAdmin && userContext.role === UserRole.ADMIN)) {
    await assertDisputeParticipant({ disputeId, userId });
  }

  return getDisputeAuditTrail(disputeId);
}

export async function triggerTimeoutAutoReleaseSweepAction() {
  const timeoutSeconds = getFundReleaseTimeoutSeconds();
  const cutoff = new Date(Date.now() - timeoutSeconds * 1000);

  const candidates = await getTimeoutEligibleJobs(cutoff);
  const processed: {
    jobId: number;
    status: "released" | "skipped" | "failed";
    txHash?: string;
    reason?: string;
  }[] = [];

  for (const job of candidates) {
    await prisma.auditLog.create({
      data: {
        action: "TIMEOUT_AUTO_RELEASE_TRIGGERED",
        metadata: {
          jobId: job.id,
          applyReleaseAt: job.applyReleaseAt,
          timeoutSeconds,
        },
        result: "ALLOWED",
      },
    });

    const hasActive = await hasActiveDisputeForJob(job.id);
    if (hasActive) {
      processed.push({
        jobId: job.id,
        status: "skipped",
        reason: "Active dispute exists",
      });

      await prisma.auditLog.create({
        data: {
          action: "TIMEOUT_AUTO_RELEASE_SKIPPED_ACTIVE_DISPUTE",
          metadata: {
            jobId: job.id,
          },
          result: "BLOCKED",
        },
      });
      continue;
    }

    const tx = await executeAdminEscrowTransaction({
      functionName: "autoReleaseAfterTimeout",
      functionArgs: [job.id, BigInt(timeoutSeconds)],
    });

    if (!tx.success) {
      processed.push({
        jobId: job.id,
        status: "failed",
        reason: tx.errorMsg,
      });

      await prisma.auditLog.create({
        data: {
          action: "TIMEOUT_AUTO_RELEASE_FAILED",
          metadata: {
            jobId: job.id,
            error: tx.errorMsg,
          },
          result: "BLOCKED",
        },
      });
      continue;
    }

    await markJobTimeoutAutoReleased({
      jobId: job.id,
      txHash: tx.txHash,
    });

    processed.push({
      jobId: job.id,
      status: "released",
      txHash: tx.txHash,
    });

    await prisma.auditLog.create({
      data: {
        action: "TIMEOUT_AUTO_RELEASE_CONFIRMED",
        metadata: {
          jobId: job.id,
          txHash: tx.txHash,
        },
        result: "ALLOWED",
      },
    });
  }

  return {
    success: true,
    timeoutSeconds,
    candidates: candidates.length,
    processed,
  };
}
