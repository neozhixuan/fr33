import { OnboardingStage } from "@/generated/prisma-client";

export function Checkpointer({ stage }: { stage: OnboardingStage | null }) {
  // Map enum to numeric stages
  const stageOrder: Record<OnboardingStage, number> = {
    WALLET_PENDING: 1,
    KYC_PENDING: 2,
    VC_PENDING: 3,
    COMPLETED: 4,
  };
  const currentStageNumber = stage ? stageOrder[stage] : 0;
  const steps = [
    { id: 1, title: "Wallet", subtitle: "Create smart account" },
    { id: 2, title: "KYC", subtitle: "Identity verification" },
    { id: 3, title: "VC", subtitle: "Issue credential" },
    { id: 4, title: "Complete", subtitle: "Access portal" },
  ];

  const getStageClass = (stepNumber: number) => {
    if (stepNumber < currentStageNumber) {
      return "border-[#7cf39e]/40 bg-[#7cf39e]/10 text-[#7cf39e]";
    }
    if (stepNumber === currentStageNumber) {
      return "border-[#00f2ff]/50 bg-[#00f2ff]/10 text-[#00f2ff]";
    }
    return "border-white/15 bg-[#201f20] text-[#b9cacb]";
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step) => (
        <div
          key={step.id}
          className={`rounded-xl border p-4 transition-all ${getStageClass(step.id)}`}
        >
          <p className="text-[10px] uppercase tracking-[0.25em]">Step {step.id}</p>
          <p className="mt-1 text-sm font-bold uppercase tracking-[0.1em]">{step.title}</p>
          <p className="mt-1 text-xs opacity-90">{step.subtitle}</p>
        </div>
      ))}
    </div>
  );
}
