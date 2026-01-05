"use server";

import { JobStatus } from "@/generated/prisma-client";
import CentralContainer from "@/layout/CentralContainer";
import { fundEscrowAction, getJobDetailsAction } from "@/lib/jobActions";
import { auth } from "@/server/auth";
import Button from "@/ui/Button";
import { getFallbackURL } from "@/utils/errors";
import { redirect } from "next/navigation";

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

  const job = await getJobDetailsAction(parseInt(jobId));
  if (!job) {
    redirect("/job-portal?error=job-not-found");
    return;
  }

  return (
    <CentralContainer>
      <div>Job Page for Job ID: {jobId}</div>
      <p>Title: {job.title}</p>
      <p>Description: {job.description}</p>
      <p>Payment: SGD {job.amount.toFixed(2)}</p>
      <p>Posted on: {new Date(job.createdAt).toLocaleDateString()}</p>
      <p>
        Job Status:{" "}
        {job.status === JobStatus.POSTED ? "Not funded yet" : job.status}
      </p>
      <p>Employer ID: {job.employerId}</p>
      {userId === job.employerId && (
        <div className="flex flex-col gap-4 w-[300px] border rounded-lg p-4">
          <strong>Employer Actions</strong>
          {job.status === JobStatus.POSTED ? (
            <form
              action={async () => {
                "use server";
                await fundEscrowAction({ jobId: job.id, employerId: userId });
              }}
            >
              <Button type="submit">Fund Job</Button>
            </form>
          ) : (
            <p>Job is already funded.</p>
          )}
        </div>
      )}
      {job.status === JobStatus.FUNDED && (
        <>
          <p>Escrow Address: {job.escrowAddress}</p>
          <p>On-chain Job ID: {job.onChainJobId}</p>
          <p>Worker Wallet: {job.workerWallet}</p>
        </>
      )}
    </CentralContainer>
  );
}
