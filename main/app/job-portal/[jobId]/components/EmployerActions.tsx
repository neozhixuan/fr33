"use client";

import { JobStatus } from "@/generated/prisma-client";
import { acceptFundReleaseAction, fundEscrowAction } from "@/lib/jobActions";
import { JobForClientType } from "@/types";
import Button from "@/ui/Button";
import ActionForm from "./ActionForm";
import ActionStatusCard from "./ActionStatusCard";
import { useActionState, useState } from "react";

interface FundJobFormProps {
  job: JobForClientType;
  employerId: number;
}

type FundedStateType = {
  fundedAt: string;
  fundedTxHash: string;
};

type ReleaseStateType = {
  releasedAt: string;
  releaseTxHash: string;
};

export default function EmployerActions({ job, employerId }: FundJobFormProps) {
  const [fundedState, setFundedState] = useState<FundedStateType>({
    fundedAt: job.fundedAt ? new Date(job.fundedAt).toLocaleString() : "N/A",
    fundedTxHash: job.fundedTxHash || "",
  });

  const [acceptFundReleaseState, setAcceptFundReleaseState] =
    useState<ReleaseStateType>({
      releasedAt: job.approveReleaseAt
        ? new Date(job.approveReleaseAt).toLocaleString()
        : "N/A",
      releaseTxHash: job.approveReleaseTxHash || "",
    });

  const [state, fundAction, isFundEscrowPending] = useActionState(
    async () => {
      const { success, errorMsg, txHash } = await fundEscrowAction({
        jobId: job.id,
        employerId,
      });
      if (success) {
        setFundedState({
          fundedTxHash: txHash ?? "Error",
          fundedAt: new Date().toLocaleString(),
        });
      }

      return { success, errorMsg };
    },
    { success: false, errorMsg: "" }
  );

  const [acceptReleaseState, acceptReleaseAction, isAcceptReleasePending] =
    useActionState(
      async () => {
        const { success, errorMsg, txHash } = await acceptFundReleaseAction({
          jobId: job.id,
          employerId,
        });
        if (success) {
          setAcceptFundReleaseState({
            releaseTxHash: txHash ?? "N/A",
            releasedAt: new Date().toLocaleString(),
          });
        }

        return { success, errorMsg };
      },
      { success: false, errorMsg: "" }
    );

  return (
    <>
      {fundedState.fundedAt === "N/A" ? (
        // Not funded
        <ActionForm
          action={fundAction}
          isPending={isFundEscrowPending}
          state={state}
          buttonLabel="Fund Job"
          successMessage="Job funded successfully!"
          className="flex flex-col gap-3 w-full"
        />
      ) : (
        // Funded
        <ActionStatusCard
          title="Job is already funded."
          dateLabel="Funded at"
          dateValue={job.fundedAt ? fundedState.fundedAt : "N/A"}
          hashLabel="Transaction hash for funding action"
          hashValue={fundedState.fundedTxHash || "N/A"}
        />
      )}
      {job.status === JobStatus.PENDING_APPROVAL &&
        (acceptFundReleaseState.releasedAt === "N/A" ? (
          // Approve fund release
          <ActionForm
            action={acceptReleaseAction}
            isPending={isAcceptReleasePending}
            state={acceptReleaseState}
            buttonLabel="Approve Release"
            successMessage="Release approved successfully!"
          />
        ) : (
          // Already approved fund release
          <ActionStatusCard
            title="Fund release has been approved."
            dateLabel="Released at"
            dateValue={
              job.approveReleaseAt ? acceptFundReleaseState.releasedAt : "N/A"
            }
            hashLabel="Transaction hash for release approval"
            hashValue={acceptFundReleaseState.releaseTxHash || "N/A"}
          />
        ))}
    </>
  );
}
