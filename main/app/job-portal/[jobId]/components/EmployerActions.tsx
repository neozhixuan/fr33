"use client";

import { JobStatus, Wallet } from "@/generated/prisma-client";
import {
  acceptFundReleaseAction,
  deleteJobAction,
  fundEscrowAction,
  refundPaymentAction,
} from "@/lib/jobActions";
import { JobForClientType } from "@/utils/types";
import Button from "@/ui/Button";
import ActionForm from "./ActionForm";
import ActionStatusCard from "./ActionStatusCard";
import { useActionState, useState } from "react";
import { redirect } from "next/navigation";
import { checkIsUserActionAllowed } from "@/lib/vcActions";


interface FundJobFormProps {
  job: JobForClientType;
  employerId: number;
  wallet: Wallet;
}

type FundedStateType = {
  fundedAt: string;
  fundedTxHash: string;
};

type ReleaseStateType = {
  releasedAt: string;
  releaseTxHash: string;
};

export default function EmployerActions({ job, employerId, wallet }: FundJobFormProps) {
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
      const isActionAllowed = await checkIsUserActionAllowed(wallet);
      if (!isActionAllowed) {
        alert("You are not compliant with the requirements to fund the escrow. Please ensure you have the necessary credentials and try again.");
        return { success: false, errorMsg: "You are not allowed to fund the escrow." };
      }

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
    { success: false, errorMsg: "" },
  );

  const [acceptReleaseState, acceptReleaseAction, isAcceptReleasePending] =
    useActionState(
      async () => {
        const isActionAllowed = await checkIsUserActionAllowed(wallet);
        if (!isActionAllowed) {
          alert("You are not compliant with the requirements to approve fund release. Please ensure you have the necessary credentials and try again.");
          return { success: false, errorMsg: "You are not allowed to approve fund release." };
        }

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
      { success: false, errorMsg: "" },
    );

  const [deleteJobState, deleteAction, isDeleteJobPending] = useActionState(
    async () => {
      const isActionAllowed = await checkIsUserActionAllowed(wallet);
      if (!isActionAllowed) {
        alert("You are not compliant with the requirements to delete a job. Please ensure you have the necessary credentials and try again.");
        return { success: false, errorMsg: "You are not allowed to delete a job." };
      }

      const { success, errorMsg } = await deleteJobAction({
        jobId: job.id,
        employerId,
      }); // Cannot pass callback from server to client component
      if (success) {
        redirect("/job-portal?message=job-deleted");
      }

      return { success, errorMsg };
    },
    { success: false, errorMsg: "" },
  );

  const [refundState, refundAction, isRefundPending] = useActionState(
    async () => {
      const isActionAllowed = await checkIsUserActionAllowed(wallet);
      if (!isActionAllowed) {
        alert("You are not authorized to refund the payment. Please ensure you have the necessary credentials.");
        return { success: false, errorMsg: "You are not authorized to refund the payment." };
      }

      const { success, errorMsg } = await refundPaymentAction({
        jobId: job.id,
        employerId,
      });

      if (success) {
        setFundedState({
          fundedAt: "N/A",
          fundedTxHash: "",
        });
      }

      return { success, errorMsg };
    },
    { success: false, errorMsg: "" },
  );

  return (
    <div className="space-y-4">
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
        <>
          <ActionStatusCard
            title="Job is already funded."
            dateLabel="Funded at"
            dateValue={job.fundedAt ? fundedState.fundedAt : "N/A"}
            hashLabel="Transaction hash for funding action"
            hashValue={fundedState.fundedTxHash || "N/A"}
          />
          {refundState.success && (
            <p className="text-sm text-[#7cf39e]">Payment refunded successfully.</p>
          )}
          {refundState.errorMsg && (
            <p className="text-sm text-red-300">{refundState.errorMsg}</p>
          )}
          <form action={refundAction}>
            <Button className="w-full bg-red-500 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em]">
              {isRefundPending ? "Refunding..." : "Refund Funded Payment"}
            </Button>
          </form>
        </>
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
      {
        <form action={deleteAction}>
          {deleteJobState.success && (
            <p className="mb-2 text-sm text-[#7cf39e]">Job deleted successfully.</p>
          )}
          {deleteJobState.errorMsg && (
            <p className="mb-2 text-sm text-red-300">{deleteJobState.errorMsg}</p>
          )}
          <Button
            type="submit"
            className="w-full bg-red-500 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em]"
            disabled={isDeleteJobPending}
          >
            {isDeleteJobPending ? "Deleting Job..." : "Delete Job"}
          </Button>
        </form>
      }
    </div>
  );
}
