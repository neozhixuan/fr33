"use client";

import Button from "@/ui/Button";

interface ActionFormProps {
  action: () => void;
  isPending: boolean;
  state: { success?: boolean; errorMsg?: string };
  buttonLabel: string;
  successMessage?: string;
  className?: string;
}

export default function ActionForm({
  action,
  isPending,
  state,
  buttonLabel,
  successMessage = "Action completed successfully!",
  className,
}: ActionFormProps) {
  return (
    <form action={action} className={className}>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Processing..." : buttonLabel}
      </Button>
      {state?.errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded p-3 max-h-[200px] overflow-y-auto">
          <p className="text-red-700 text-sm break-words">{state.errorMsg}</p>
        </div>
      )}
      {/* {state?.success && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="text-green-700 text-sm">{successMessage}</p>
        </div>
      )} */}
    </form>
  );
}
