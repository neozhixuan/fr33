"use client";

import { useFormState } from "react-dom";
import { fundEscrowAction } from "@/lib/jobActions";
import Button from "@/ui/Button";

interface FundJobFormProps {
  jobId: number;
  employerId: number;
}

export default function FundJobForm({ jobId, employerId }: FundJobFormProps) {
  const [state, formAction, isPending] = useFormState(
    async () => {
      return await fundEscrowAction({ jobId, employerId });
    },
    { success: false, errorMsg: "" }
  );

  return (
    <form action={formAction} className="flex flex-col gap-3 w-full">
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Processing..." : "Fund Job"}
      </Button>
      {state?.errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded p-3 max-h-[200px] overflow-y-auto">
          <p className="text-red-700 text-sm break-words">{state.errorMsg}</p>
        </div>
      )}
      {state?.success && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="text-green-700 text-sm">Job funded successfully!</p>
        </div>
      )}
    </form>
  );
}
