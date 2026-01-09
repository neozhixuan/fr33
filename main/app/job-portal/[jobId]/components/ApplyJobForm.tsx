"use client";

import { Job } from "@/generated/prisma-client";
import { acceptJobAction } from "@/lib/jobActions";
import Button from "@/ui/Button";
import { useActionState, useState } from "react";

interface ApplyJobFormProps {
  job: Omit<Job, "amount"> & { amount: number };
  workerId: number;
  workerWallet: string;
}

export default function ApplyJobForm({
  job,
  workerId,
  workerWallet,
}: ApplyJobFormProps) {
  const [acceptState, setAcceptState] = useState<{
    acceptTxHash: string;
    acceptedAt: Date;
  }>({
    acceptTxHash: job.acceptTxHash || "N/A",
    acceptedAt: job.acceptedAt || new Date(0),
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
          acceptedAt: new Date(),
        });
      }

      return { success, errorMsg };
    },
    { success: false, errorMsg: "" }
  );

  return (
    <>
      {acceptState.acceptTxHash === "N/A" ? (
        <form action={applyAction}>
          <Button
            type="submit"
            disabled={isAcceptJobPending}
            className="w-full"
          >
            {isAcceptJobPending ? "Processing..." : "Accept Job"}
          </Button>
          {acceptJobState?.errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded p-3 max-h-[200px] overflow-y-auto">
              <p className="text-red-700 text-sm break-words">
                {acceptJobState.errorMsg}
              </p>
            </div>
          )}
          {acceptJobState?.success && (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="text-green-700 text-sm">
                Job accepted successfully!
              </p>
            </div>
          )}
        </form>
      ) : (
        <>
          <p>Job is already accepted.</p>{" "}
          <div>
            <p>
              <b>Funded at:</b>{" "}
              {job.acceptedAt
                ? new Date(acceptState.acceptedAt).toLocaleString()
                : "N/A"}
            </p>
            <br />
            <p className="break-words">
              <b>Transaction hash for acceptance action:</b>{" "}
              {acceptState.acceptTxHash}
            </p>
            {job.workerWallet && job.workerWallet === workerWallet && (
              <>
                <Button>Apply for Fund Release</Button>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
