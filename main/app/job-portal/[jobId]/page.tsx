"use server";

import { JobStatus } from "@/generated/prisma-client";
import CentralContainer from "@/layout/CentralContainer";
import { getJobDetailsAction } from "@/lib/jobActions";
import { auth } from "@/server/auth";
import { getFallbackURL } from "@/utils/errors";
import { redirect } from "next/navigation";
import FundJobForm from "./components/FundJobForm";

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
            <FundJobForm jobId={job.id} employerId={userId} />
          ) : (
            <>
              <p>Job is already funded.</p>{" "}
              {job.status === JobStatus.FUNDED && (
                <div>
                  <p>
                    <b>Funded at:</b>{" "}
                    {job.fundedAt
                      ? new Date(job.fundedAt).toLocaleString()
                      : "N/A"}
                  </p>
                  <br />
                  <p className="break-words">
                    <b>Transaction hash for funding action:</b>{" "}
                    {job.fundedTxHash}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </CentralContainer>
  );
}
