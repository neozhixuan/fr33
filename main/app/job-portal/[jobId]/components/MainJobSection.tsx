import { JobStatus } from "@/generated/prisma-client";
import { JobForClientType } from "@/types";

export default function MainJobSection({ job }: { job: JobForClientType }) {
  return (
    <>
      <div>Job Page for Job ID: {job.id}</div>
      <p>Title: {job.title}</p>
      <p>Description: {job.description}</p>
      <p>Payment: SGD {job.amount.toFixed(2)}</p>
      <p>Posted on: {new Date(job.createdAt).toLocaleDateString()}</p>
      <p>
        Job Status:{" "}
        {job.status === JobStatus.POSTED ? "Not funded yet" : job.status}
      </p>
      <p>Employer ID: {job.employerId}</p>
    </>
  );
}
