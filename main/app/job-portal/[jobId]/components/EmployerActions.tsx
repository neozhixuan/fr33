"use client";

import { JobStatus, Wallet } from "@/generated/prisma-client";
import {
  confirmAcceptFundReleaseAction,
  confirmFundEscrowAction,
  confirmRefundPaymentAction,
  deleteJobAction,
  prepareAcceptFundReleaseAction,
  prepareFundEscrowAction,
  prepareRefundPaymentAction,
} from "@/lib/jobActions";
import { JobForClientType, ReleaseEvidenceItem } from "@/type/general";
import Button from "@/ui/Button";
import ActionForm from "./ActionForm";
import ActionStatusCard from "./ActionStatusCard";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { checkIsUserActionAllowed } from "@/lib/vcActions";
import ReleaseEvidenceReview from "./ReleaseEvidenceReview";
import { formatDateConsistent } from "@/utils/constants";
import { prepareAndSignSmartAccountTransaction } from "@/lib/preparedTransactionFlow";


interface FundJobFormProps {
  job: JobForClientType;
  employerId: number;
  wallet: Wallet;
  releaseEvidences: ReleaseEvidenceItem[];
}

type FundedStateType = {
  fundedAt: string;
  fundedTxHash: string;
};

type ReleaseStateType = {
  releasedAt: string;
  releaseTxHash: string;
};

export default function EmployerActions({
  job,
  employerId,
  wallet,
  releaseEvidences,
}: FundJobFormProps) {
  const router = useRouter();
  const [fundUiState, setFundUiState] = useState({
    success: false,
    errorMsg: "",
  });
  const [refundUiState, setRefundUiState] = useState({
    success: false,
    errorMsg: "",
  });

  const [fundedState, setFundedState] = useState<FundedStateType>({
    fundedAt: job.fundedAt ? formatDateConsistent(job.fundedAt) : "N/A",
    fundedTxHash: job.fundedTxHash || "",
  });

  const [acceptFundReleaseState, setAcceptFundReleaseState] =
    useState<ReleaseStateType>({
      releasedAt: job.approveReleaseAt
        ? formatDateConsistent(job.approveReleaseAt)
        : "N/A",
      releaseTxHash: job.approveReleaseTxHash || "",
    });

  const [, fundAction, isFundEscrowPending] = useActionState(
    async () => {
      setFundUiState({ success: false, errorMsg: "" });
      setRefundUiState({ success: false, errorMsg: "" });

      const isActionAllowed = await checkIsUserActionAllowed(wallet);
      if (!isActionAllowed) {
        alert("You are not compliant with the requirements to fund the escrow. Please ensure you have the necessary credentials and try again.");
        const next = { success: false, errorMsg: "You are not allowed to fund the escrow." };
        setFundUiState(next);
        return next;
      }

      const signedTx = await prepareAndSignSmartAccountTransaction({
        userId: employerId,
        walletAddress: wallet.address,
        prepare: () =>
          prepareFundEscrowAction({
            jobId: job.id,
            employerId,
          }),
      });

      if (!signedTx.success) {
        const next = {
          success: false,
          errorMsg: signedTx.errorMsg || "Transaction failed",
        };
        setFundUiState(next);
        return next;
      }

      const { success, errorMsg, txHash } = await confirmFundEscrowAction({
        jobId: job.id,
        employerId,
        txHash: signedTx.txHash,
        userOpHash: signedTx.userOpHash,
      });

      if (success) {
        setFundedState({
          fundedTxHash: txHash ?? "Error",
          fundedAt: formatDateConsistent(new Date()),
        });
        setFundUiState({ success: true, errorMsg: "" });
        router.refresh();
      } else {
        setFundUiState({ success: false, errorMsg: errorMsg || "Funding failed" });
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

        const signedTx = await prepareAndSignSmartAccountTransaction({
          userId: employerId,
          walletAddress: wallet.address,
          prepare: () =>
            prepareAcceptFundReleaseAction({
              jobId: job.id,
              employerId,
            }),
        });

        if (!signedTx.success) {
          return { success: false, errorMsg: signedTx.errorMsg || "Transaction failed" };
        }

        const { success, errorMsg, txHash } = await confirmAcceptFundReleaseAction({
          jobId: job.id,
          employerId,
          txHash: signedTx.txHash,
          userOpHash: signedTx.userOpHash,
        });

        if (success) {
          setAcceptFundReleaseState({
            releaseTxHash: txHash ?? "N/A",
            releasedAt: formatDateConsistent(new Date()),
          });
          router.refresh();
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
        router.replace("/job-portal?message=job-deleted");
        return { success: true, errorMsg: "" };
      }

      return { success, errorMsg };
    },
    { success: false, errorMsg: "" },
  );

  const [, refundAction, isRefundPending] = useActionState(
    async () => {
      setRefundUiState({ success: false, errorMsg: "" });

      const isActionAllowed = await checkIsUserActionAllowed(wallet);
      if (!isActionAllowed) {
        alert("You are not authorized to refund the payment. Please ensure you have the necessary credentials.");
        const next = {
          success: false,
          errorMsg: "You are not authorized to refund the payment.",
        };
        setRefundUiState(next);
        return next;
      }

      const signedTx = await prepareAndSignSmartAccountTransaction({
        userId: employerId,
        walletAddress: wallet.address,
        prepare: () =>
          prepareRefundPaymentAction({
            jobId: job.id,
            employerId,
          }),
      });

      if (!signedTx.success) {
        const next = {
          success: false,
          errorMsg: signedTx.errorMsg || "Transaction failed",
        };
        setRefundUiState(next);
        return next;
      }

      const { success, errorMsg } = await confirmRefundPaymentAction({
        jobId: job.id,
        employerId,
        txHash: signedTx.txHash,
        userOpHash: signedTx.userOpHash,
      });

      if (success) {
        setFundedState({
          fundedAt: "N/A",
          fundedTxHash: "",
        });
        setFundUiState({ success: false, errorMsg: "" });
        setRefundUiState({ success: true, errorMsg: "" });
        router.refresh();
      } else {
        setRefundUiState({ success: false, errorMsg: errorMsg || "Refund failed" });
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
          state={fundUiState}
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
          {refundUiState.success && (
            <p className="text-sm text-[#7cf39e]">Payment refunded successfully.</p>
          )}
          {refundUiState.errorMsg && (
            <p className="text-sm text-red-300">{refundUiState.errorMsg}</p>
          )}
          <form action={refundAction}>
            <Button className="w-full bg-red-500 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em]">
              {isRefundPending ? "Refunding..." : "Refund Funded Payment"}
            </Button>
          </form>
        </>
      )}
      {job.status === JobStatus.PENDING_APPROVAL &&
        releaseEvidences.length > 0 && (
          <ReleaseEvidenceReview releaseEvidences={releaseEvidences} />
        )}

      {job.status === JobStatus.PENDING_APPROVAL &&
        releaseEvidences.length === 0 && (
          <p className="text-xs text-[#f7b267]">
            Worker evidence has not been submitted yet. Approval is blocked until evidence is available.
          </p>
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
