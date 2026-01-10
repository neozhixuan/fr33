"use server";

import { JobStatus, UserRole } from "@/generated/prisma-client";
import CentralContainer from "@/layout/CentralContainer";
import { getJobDetailsAction } from "@/lib/jobActions";
import { auth } from "@/server/auth";
import { getFallbackURL } from "@/utils/errors";
import { redirect } from "next/navigation";
import EmployerActions from "./components/EmployerActions";
import Button from "@/ui/Button";
import { ensureAuthorisedAndCompliantUser } from "../page";
import WorkerActions from "./components/WorkerActions";
import MainJobSection from "./components/MainJobSection";

type JobPageProps = {
  params: Promise<{ jobId: string }>;
};

export default async function JobPage({ params }: JobPageProps) {
  const { jobId } = await params;

  const session = await auth();
  if (!session || !session?.user || !session?.user?.id) {
    redirect(getFallbackURL("job-portal", "unauthorised"));
  }

  const userId = parseInt(session.user.id as string);

  const { user, wallet } = await ensureAuthorisedAndCompliantUser(session.user);

  const job = await getJobDetailsAction(parseInt(jobId));
  if (!job) {
    redirect("/job-portal?error=job-not-found");
  }

  // Convert Decimal to number for Client Component
  const jobForClient = {
    ...job,
    amount:
      typeof job.amount === "object"
        ? job.amount.toNumber?.()
        : Number(job.amount),
  };

  return (
    <CentralContainer>
      <Button href="/job-portal">Back to Job Portal</Button>

      <MainJobSection job={jobForClient} />

      {/* Employer Actions */}
      {userId === job.employerId && (
        <div className="flex flex-col gap-4 w-[300px] border rounded-lg p-4">
          <strong>Employer Actions</strong>
          {wallet ? (
            <p className="break-words">
              Employer wallet:{" "}
              <a
                href={`https://amoy.polygonscan.com/address/${wallet.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-decoration-line text-blue-900"
              >
                {wallet.address}
              </a>
            </p>
          ) : (
            <p>Unexpected Error: No wallet linked</p>
          )}
          <EmployerActions job={jobForClient} employerId={userId} />
        </div>
      )}

      {/* Worker Actions (when job is funded) */}
      {/* TODO: Cleanup */}
      {user.role === UserRole.WORKER &&
        (job.status === JobStatus.FUNDED ||
          job.status === JobStatus.IN_PROGRESS ||
          job.status === JobStatus.PENDING_APPROVAL) && (
          <div className="flex flex-col gap-4 w-[300px] border rounded-lg p-4">
            <strong>Worker Actions</strong>
            {wallet ? (
              <p className="break-words">
                Worker wallet:{" "}
                <a
                  href={`https://amoy.polygonscan.com/address/${wallet.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-decoration-line text-blue-900"
                >
                  {wallet.address}
                </a>
              </p>
            ) : (
              <p>Unexpected Error: No wallet linked</p>
            )}
            <WorkerActions
              job={jobForClient}
              workerId={userId}
              workerWallet={wallet?.address || ""}
            />
            <p></p>
          </div>
        )}
    </CentralContainer>
  );
}
