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

  // Get the style for each stage
  const completedStyle = "bg-green-500 text-white";
  const currentStyle = "bg-yellow-500 text-white";
  const getStageStyle = (stageNum: number) => {
    return stageNum < currentStageNumber
      ? completedStyle
      : stageNum === currentStageNumber
      ? currentStyle
      : "";
  };

  return (
    <div className="flex flex-row gap-5">
      <span>Stages:</span>
      <span className={getStageStyle(1)}>1</span>
      <span className={getStageStyle(2)}>2</span>
      <span className={getStageStyle(3)}>3</span>
      <span className={getStageStyle(4)}>4</span>
    </div>
  );
}
