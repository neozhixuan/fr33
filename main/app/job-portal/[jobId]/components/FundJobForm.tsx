"use client";

import { Job } from "@/generated/prisma-client";
import { fundEscrowAction } from "@/lib/jobActions";
import Button from "@/ui/Button";
import { useActionState, useState } from "react";

interface FundJobFormProps {
  job: Omit<Job, "amount"> & { amount: number };
  employerId: number;
}

type FundedStateType = {
  fundedAt: string;
  fundedTxHash: string;
};

export default function FundJobForm({ job, employerId }: FundJobFormProps) {
  const [fundedState, setFundedState] = useState<FundedStateType>({
    fundedAt: job.fundedAt ? new Date(job.fundedAt).toLocaleString() : "N/A",
    fundedTxHash: job.fundedTxHash || "",
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

  return (
    <>
      {fundedState.fundedAt === "N/A" ? (
        // Not funded
        <form action={fundAction} className="flex flex-col gap-3 w-full">
          <Button
            type="submit"
            disabled={isFundEscrowPending}
            className="w-full"
          >
            {isFundEscrowPending ? "Processing..." : "Fund Job"}
          </Button>
          {state?.errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded p-3 max-h-[200px] overflow-y-auto">
              <p className="text-red-700 text-sm break-words">
                {state.errorMsg}
              </p>
            </div>
          )}
          {state?.success && (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="text-green-700 text-sm">Job funded successfully!</p>
            </div>
          )}
        </form>
      ) : (
        // Funded
        <>
          <p>Job is already funded.</p>{" "}
          <div>
            <p>
              <b>Funded at:</b>{" "}
              {job.fundedAt
                ? new Date(fundedState.fundedAt).toLocaleString()
                : "N/A"}
            </p>
            <br />
            <p className="break-words">
              <b>Transaction hash for funding action:</b>{" "}
              {fundedState.fundedTxHash}
            </p>
          </div>
        </>
      )}
    </>
  );
}
