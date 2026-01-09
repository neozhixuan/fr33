"use client";

import { postingJobAction } from "@/lib/jobActions";
import Button from "@/ui/Button";
import FormInput from "@/ui/FormInput";
import { useActionState } from "react";

export function PostJobForm({ employerId }: { employerId: number }) {
  const [postJobErrorMessage, postJobAction, isPostJobPending] = useActionState(
    postingJobAction,
    undefined
  );

  return (
    <form action={postJobAction} className="space-y-3 position-relative  w-1/3">
      <div className="w-full flex flex-col gap-5">
        {postJobErrorMessage && (
          <div
            role="alert"
            className="text-red-500 text-sm position-absolute top-0 left-0 w-full"
          >
            {postJobErrorMessage}
          </div>
        )}

        <FormInput
          id="title"
          type="text"
          placeholder="Enter the title of the job"
          label="Job Title"
          required
        />

        <FormInput
          id="description"
          type="text"
          placeholder="Enter the description of the job"
          label="Job Description"
          required
        />

        <FormInput
          id="payment"
          type="number"
          placeholder="Enter the value of money released upon job completion"
          label="Payment Amount to 2 decimal places (in SGD)"
          required
          step={0.01}
        />

        <input type="hidden" name="employerId" value={employerId} />

        <Button
          type="submit"
          aria-disabled={isPostJobPending}
          disabled={isPostJobPending}
        >
          Post the Job
        </Button>
      </div>
    </form>
  );
}
