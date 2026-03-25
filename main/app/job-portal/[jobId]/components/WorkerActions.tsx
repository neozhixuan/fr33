"use client";

import { Job, Wallet } from "@/generated/prisma-client";
import { acceptJobAction, applyFundReleaseAction } from "@/lib/jobActions";
import ActionForm from "./ActionForm";
import ActionStatusCard from "./ActionStatusCard";
import { useActionState, useState } from "react";
import { checkIsUserActionAllowed } from "@/lib/vcActions";
import { useRouter } from "next/navigation";
import ReleaseEvidenceImageInput from "./ReleaseEvidenceImageInput";
import { uploadEvidenceAndGetUrl } from "@/lib/cloudinary";
import { formatDateOnly } from "@/utils/constants";

interface ApplyJobFormProps {
  job: Omit<Job, "amount"> & { amount: number };
  workerId: number;
  workerWallet: Wallet;
}

export default function WorkerActions({
  job,
  workerId,
  workerWallet,
}: ApplyJobFormProps) {
  const router = useRouter();

  const [acceptState, setAcceptState] = useState<{
    acceptTxHash: string;
    acceptedAt: string | undefined;
  }>({
    acceptTxHash: job.acceptTxHash || "N/A",
    acceptedAt: job.acceptedAt
      ? formatDateOnly(job.acceptedAt)
      : undefined,
  });

  const [applyFundReleaseState, setApplyFundReleaseState] = useState<{
    applyReleaseTxHash: string;
    appliedAt: string | undefined;
  }>({
    applyReleaseTxHash: job.applyReleaseTxHash || "N/A",
    appliedAt: job.applyReleaseAt
      ? formatDateOnly(job.applyReleaseAt)
      : undefined,
  });
  const [releaseEvidenceText, setReleaseEvidenceText] = useState("");
  const [releaseEvidenceImageDataUrl, setReleaseEvidenceImageDataUrl] = useState("");
  const [releaseEvidenceImageName, setReleaseEvidenceImageName] = useState("");

  const [acceptJobState, applyAction, isAcceptJobPending] = useActionState(
    async () => {
      const isActionAllowed = await checkIsUserActionAllowed(workerWallet);
      if (!isActionAllowed) {
        alert("You are not compliant with the requirements to accept a job. Please ensure you have the necessary credentials and try again.");
        return { success: false, errorMsg: "You are not allowed to accept a job." };
      }

      const { success, errorMsg, txHash } = await acceptJobAction({
        jobId: job.id,
        workerId,
      });
      if (success) {
        setAcceptState({
          acceptTxHash: txHash ?? "Error",
          acceptedAt: new Date().toLocaleDateString(),
        });
        router.refresh();
      }

      return { success, errorMsg };
    },
    { success: false, errorMsg: "" }
  );

  const [applyFundState, applyFundAction, isApplyFundPending] = useActionState(
    async () => {
      const isActionAllowed = await checkIsUserActionAllowed(workerWallet);
      if (!isActionAllowed) {
        alert("You are not compliant with the requirements to apply for fund release. Please ensure you have the necessary credentials and try again.");
        return { success: false, errorMsg: "You are not allowed to apply for fund release." };
      }

      if (!releaseEvidenceText.trim()) {
        alert("Please provide evidence text before applying for fund release.");
        return { success: false, errorMsg: "Please provide evidence text before applying for fund release." };
      }

      const { uploadSuccess, errorMsg: uploadErrorMsg, uploadedImageUrl } = await uploadEvidenceAndGetUrl(releaseEvidenceText, releaseEvidenceImageDataUrl);
      if (!uploadSuccess) {
        alert(uploadErrorMsg);
        return { success: false, errorMsg: uploadErrorMsg };
      }

      const { success, errorMsg, txHash } = await applyFundReleaseAction({
        jobId: job.id,
        workerId,
        evidenceText: releaseEvidenceText,
        evidenceImageDataUrl: uploadedImageUrl,
      });
      if (success) {
        setApplyFundReleaseState({
          applyReleaseTxHash: txHash ?? "Error",
          appliedAt: new Date().toLocaleDateString(),
        });
        setReleaseEvidenceText("");
        setReleaseEvidenceImageDataUrl("");
        setReleaseEvidenceImageName("");
        router.refresh();
      }

      return { success, errorMsg };
    },
    { success: false, errorMsg: "" }
  );

  return (
    <div className="space-y-4">
      {acceptState.acceptTxHash === "N/A" ? (
        <ActionForm
          action={applyAction}
          isPending={isAcceptJobPending}
          state={acceptJobState}
          buttonLabel="Accept Job"
          successMessage="Job accepted successfully!"
        />
      ) : (
        <>
          <ActionStatusCard
            title="Job is already accepted."
            dateLabel="Accepted at"
            dateValue={job.acceptedAt ? acceptState.acceptedAt ?? "N/A" : "N/A"}
            hashLabel="Transaction hash for acceptance action"
            hashValue={acceptState.acceptTxHash || "N/A"}
          />

          {job.workerWallet &&
            job.workerWallet === workerWallet.address &&
            (applyFundReleaseState.applyReleaseTxHash === "N/A" ? (
              <div className="space-y-3 rounded-md border border-white/10 bg-[#131314]/50 p-3">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#b9cacb]">
                  Work evidence (required)
                </label>
                <textarea
                  value={releaseEvidenceText}
                  onChange={(e) => setReleaseEvidenceText(e.target.value)}
                  rows={4}
                  placeholder="Describe work delivered, milestones completed, and handover notes..."
                  className="w-full rounded-md border border-white/15 bg-[#131314] px-3 py-2 text-sm text-[#e5e2e3] outline-none placeholder:text-[#b9cacb]/60"
                />

                <ReleaseEvidenceImageInput
                  imageName={releaseEvidenceImageName}
                  imagePreviewUrl={releaseEvidenceImageDataUrl}
                  onImageChange={({ imageName, imageDataUrl }) => {
                    setReleaseEvidenceImageName(imageName);
                    setReleaseEvidenceImageDataUrl(imageDataUrl);
                  }}
                />

                <ActionForm
                  action={applyFundAction}
                  isPending={isApplyFundPending}
                  state={applyFundState}
                  buttonLabel="Apply for Fund Release"
                  successMessage="Fund release applied successfully!"
                />
              </div>
            ) : (
              <ActionStatusCard
                title="Fund release has been applied."
                dateLabel="Applied at"
                dateValue={
                  job.applyReleaseAt ? applyFundReleaseState.appliedAt ?? "N/A" : "N/A"
                }
                hashLabel="Transaction hash for fund release application"
                hashValue={applyFundReleaseState.applyReleaseTxHash || "N/A"}
              />
            ))}
        </>
      )}
    </div>
  );
}
