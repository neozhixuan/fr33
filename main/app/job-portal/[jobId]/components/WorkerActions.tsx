"use client";

import { Job, Wallet } from "@/generated/prisma-client";
import { acceptJobAction, applyFundReleaseAction } from "@/lib/jobActions";
import ActionForm from "./ActionForm";
import ActionStatusCard from "./ActionStatusCard";
import { useActionState, useState } from "react";
import { checkIsUserActionAllowed } from "@/lib/vcActions";

interface ApplyJobFormProps {
  job: Omit<Job, "amount"> & { amount: number };
  workerId: number;
  workerWallet: Wallet;
}

export default function WorkerActions({
  job,
  workerId,
  workerWallet,
}: ApplyJobFormProps) {
  const [acceptState, setAcceptState] = useState<{
    acceptTxHash: string;
    acceptedAt: string | undefined;
  }>({
    acceptTxHash: job.acceptTxHash || "N/A",
    acceptedAt: job.acceptedAt
      ? new Date(job.acceptedAt).toLocaleDateString()
      : undefined,
  });

  const [applyFundReleaseState, setApplyFundReleaseState] = useState<{
    applyReleaseTxHash: string;
    appliedAt: string | undefined;
  }>({
    applyReleaseTxHash: job.applyReleaseTxHash || "N/A",
    appliedAt: job.applyReleaseAt
      ? new Date(job.applyReleaseAt).toLocaleDateString()
      : undefined,
  });

  const [acceptJobState, applyAction, isAcceptJobPending] = useActionState(
    async () => {
      const isActionAllowed = await checkIsUserActionAllowed(workerWallet);
      if (!isActionAllowed) {
        alert("You are not compliant with the requirements to accept a job. Please ensure you have the necessary credentials and try again.");
        return { success: false, errorMsg: "You are not allowed to accept a job." };
      }

      const { success, errorMsg, txHash } = await acceptJobAction({
        jobId: job.id,
        workerId,
      });
      if (success) {
        setAcceptState({
          acceptTxHash: txHash ?? "Error",
          acceptedAt: new Date().toLocaleDateString(),
        });
      }

      return { success, errorMsg };
    },
    { success: false, errorMsg: "" }
  );

  const [applyFundState, applyFundAction, isApplyFundPending] = useActionState(
    async () => {
      const isActionAllowed = await checkIsUserActionAllowed(workerWallet);
      if (!isActionAllowed) {
        alert("You are not compliant with the requirements to apply for fund release. Please ensure you have the necessary credentials and try again.");
        return { success: false, errorMsg: "You are not allowed to apply for fund release." };
      }

      const { success, errorMsg, txHash } = await applyFundReleaseAction({
        jobId: job.id,
        workerId,
      });
      if (success) {
        setApplyFundReleaseState({
          applyReleaseTxHash: txHash ?? "Error",
          appliedAt: new Date().toLocaleDateString(),
        });
      }

      return { success, errorMsg };
    },
    { success: false, errorMsg: "" }
  );

  return (
    <div className="space-y-4">
      {acceptState.acceptTxHash === "N/A" ? (
        <ActionForm
          action={applyAction}
          isPending={isAcceptJobPending}
          state={acceptJobState}
          buttonLabel="Accept Job"
          successMessage="Job accepted successfully!"
        />
      ) : (
        <>
          <ActionStatusCard
            title="Job is already accepted."
            dateLabel="Accepted at"
            dateValue={job.acceptedAt ? acceptState.acceptedAt ?? "N/A" : "N/A"}
            hashLabel="Transaction hash for acceptance action"
            hashValue={acceptState.acceptTxHash || "N/A"}
          />

          {job.workerWallet &&
            job.workerWallet === workerWallet.address &&
            (applyFundReleaseState.applyReleaseTxHash === "N/A" ? (
              <ActionForm
                action={applyFundAction}
                isPending={isApplyFundPending}
                state={applyFundState}
                buttonLabel="Apply for Fund Release"
                successMessage="Fund release applied successfully!"
              />
            ) : (
              <ActionStatusCard
                title="Fund release has been applied."
                dateLabel="Applied at"
                dateValue={
                  job.applyReleaseAt ? applyFundReleaseState.appliedAt ?? "N/A" : "N/A"
                }
                hashLabel="Transaction hash for fund release application"
                hashValue={applyFundReleaseState.applyReleaseTxHash || "N/A"}
              />
            ))}
        </>
      )}
    </div>
  );
}
