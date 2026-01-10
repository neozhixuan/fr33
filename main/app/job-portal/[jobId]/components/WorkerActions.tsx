"use client";

import { Job } from "@/generated/prisma-client";
import { acceptJobAction, applyFundReleaseAction } from "@/lib/jobActions";
import ActionForm from "./ActionForm";
import { useActionState, useState } from "react";

interface ApplyJobFormProps {
  job: Omit<Job, "amount"> & { amount: number };
  workerId: number;
  workerWallet: string;
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
    <>
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
          <br />
          <p>Job is already accepted.</p>{" "}
          <div>
            <p>
              <b>Funded at:</b>{" "}
              {job.acceptedAt ? acceptState.acceptedAt : "N/A"}
            </p>
            <br />
            <p className="break-words">
              <b>Transaction hash for acceptance action:</b>{" "}
              <a
                href={`https://amoy.polygonscan.com/tx/${acceptState.acceptTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-decoration-line text-blue-900"
              >
                {acceptState.acceptTxHash}
              </a>
            </p>
            {job.workerWallet &&
              job.workerWallet === workerWallet &&
              // Apply for fund release
              (applyFundReleaseState.applyReleaseTxHash === "N/A" ? (
                <ActionForm
                  action={applyFundAction}
                  isPending={isApplyFundPending}
                  state={applyFundState}
                  buttonLabel="Apply for Fund Release"
                  successMessage="Fund release applied successfully!"
                />
              ) : (
                // Already applied for fund release
                <>
                  <br />
                  <br />
                  <p>Fund release has been applied.</p>{" "}
                  <div>
                    <p>
                      <b>Applied at:</b>{" "}
                      {job.applyReleaseAt
                        ? applyFundReleaseState.appliedAt
                        : "N/A"}
                    </p>
                    <br />
                    <p className="break-words">
                      <b>Transaction hash for fund release application:</b>{" "}
                      <a
                        href={`https://amoy.polygonscan.com/tx/${applyFundReleaseState.applyReleaseTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-decoration-line text-blue-900"
                      >
                        {applyFundReleaseState.applyReleaseTxHash}
                      </a>
                    </p>
                  </div>
                </>
              ))}
          </div>
        </>
      )}
    </>
  );
}
