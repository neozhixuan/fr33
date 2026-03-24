"use server";

import { JobStatus, UserRole } from "@/generated/prisma-client";
import { getJobDetails } from "@/model/job";
import {
  addDisputeEvidence,
  assertDisputeParticipant,
  createDisputeAfterFreeze,
  markDisputeOnchainResolutionFailed,
  markDisputeOnchainResolved,
  markDisputeFrozenByAdmin,
  markJobTimeoutAutoReleased,
  setDisputeDecisionPendingOnchain,
} from "@/model/disputePost";
import {
  DISPUTE_OUTCOME_TO_CONTRACT_ENUM,
  getFundReleaseTimeoutSeconds,
} from "@/utils/disputeUtils";
import { executeJobTransaction } from "@/utils/aaUtils";
import { executeAdminEscrowTransaction } from "@/lib/escrowActions";
import { prisma } from "@/lib/db";
import {
  getDisputeByIdBasic,
  getDisputeDetails,
  getTimeoutEligibleJobs,
  getUserDisputeContext,
  hasActiveDisputeForJob,
  listDisputesForUser,
  listOpenDisputes,
} from "@/model/disputeGet";
import { DisputeEvidenceType, DisputeOutcome } from "@/type/disputeTypes";

// Get the list of disputes that the user is involved in, either as an employer, worker, or admin
export async function listMyDisputesAction(userId: number) {
  return listDisputesForUser(userId);
}

// Get all the disputes for this jobId
async function getDisputeByJobIdAction(jobId: number) {
  const open = await listOpenDisputes();
  return open.find((d) => d.jobId === jobId) ?? null;
}

// Get the details of a dispute, ensuring that the requesting user is either a participant in the dispute or an admin
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

// Get the list of all open disputes for admin users to review and take action on
export async function listOpenDisputesAdminAction(adminUserId: number) {
  const userContext = await getUserDisputeContext(adminUserId);
  if (!userContext || userContext.role !== UserRole.ADMIN) {
    throw new Error("Unauthorized: admin access required");
  }

  return listOpenDisputes();
}

/**
 * Create a dispute for a job, which involves freezing the escrow on-chain and creating a dispute record in the database.
 * @param params - An object containing the jobId, userId of the person initiating the dispute, and an optional reason for the dispute.
 * @returns An object indicating success, the dispute details, and transaction hashes if the on-chain operation was successful.
 */
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

// Create evidence for an existing dispute, recording the evidence in the database
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

// Decide a dispute by submitting the decision on-chain and updating the dispute status in the database. Only admins can perform this action.
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

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: "ONCHAIN_RESOLUTION_SUBMITTED",
      result: "ALLOWED",
      metadata: {
        disputeId,
        actorRole: UserRole.ADMIN,
        outcome,
        workerShareBps: outcome === "SPLIT" ? workerShareBps ?? 0 : 0,
        rationale,
      },
    },
  });

  const tx = await executeAdminEscrowTransaction({
    functionName: "resolveDispute",
    functionArgs: [
      dispute.jobId,
      DISPUTE_OUTCOME_TO_CONTRACT_ENUM[outcome],
      BigInt(outcome === "SPLIT" ? workerShareBps ?? 0 : 0),
      rationale,
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

// Admin action to freeze the escrow of a disputed job on-chain, which can be used in cases where the admin
// wants to intervene before making a final decision. Only admins can perform this action.
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

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: "ESCROW_FREEZE_REQUESTED",
      result: "ALLOWED",
      metadata: {
        disputeId,
        actorRole: UserRole.ADMIN,
        initiatedBy: "admin",
      },
    },
  });

  const tx = await executeAdminEscrowTransaction({
    functionName: "adminFreezeEscrow",
    functionArgs: [dispute.jobId],
  });

  if (!tx.success) {
    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: "ESCROW_FREEZE_FAILED",
        result: "BLOCKED",
        metadata: {
          disputeId,
          actorRole: UserRole.ADMIN,
          error: tx.errorMsg || "Unknown error",
        },
      },
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

// Trigger the timeout auto-release sweep, which checks for any jobs that have been in a pending release state for
// longer than the configured timeout period and automatically releases the funds to the worker if no active dispute
// exists. This function is intended to be called by a scheduled job (e.g., cron) and will process all eligible jobs
// in a single run.
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
