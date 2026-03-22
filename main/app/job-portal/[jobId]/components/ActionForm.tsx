"use client";

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
    <form action={action} className={`space-y-3 ${className ?? ""}`}>
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-[#00f2ff] px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#00363a] shadow-[0_0_18px_rgba(0,242,255,0.2)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Processing..." : buttonLabel}
      </button>
      {state?.errorMsg && (
        <div className="max-h-[200px] overflow-y-auto rounded border border-red-400/30 bg-red-500/10 p-3">
          <p className="break-words text-sm text-red-300">{state.errorMsg}</p>
        </div>
      )}
      {state?.success && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="text-green-700 text-sm">{successMessage}</p>
        </div>
      )}
    </form>
  );
}
