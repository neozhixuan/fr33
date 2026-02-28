"use client";

import { JobStatus } from "@/generated/prisma-client";
import { JobListingsResult } from "@/types";
import Button from "@/ui/Button";
import { POL_TO_SGD_RATE } from "@/utils/constants";
import { redirect } from "next/navigation";

export function JobListings({
  jobs,
  page,
}: {
  jobs: JobListingsResult;
  page: number;
}) {
  const handleJobOnClick = (jobId: string) => {
    redirect(`/job-portal/${jobId}`);
  };

  return (
    <>
      {jobs.items.length === 0 ? (
        <p>No job listings available.</p>
      ) : (
        <>
          <p>{jobs.total} job listings found.</p>
          <ul className="w-[300px] flex flex-col gap-5 ">
            {jobs.items.map((job) => (
              <div
                key={job.id}
                className="w-full border p-3 rounded-lg flex flex-col items-center cursor-pointer hover:bg-gray-100"
                onClick={() => handleJobOnClick(job.id.toString())}
              >
                <strong>
                  Job ID {job.id}: {job.title}
                </strong>
                <p>{job.description}</p>
                <p>
                  {" "}
                  Payment: SGD {job.amount.toFixed(2)} / POL{" "}
                  {(job.amount / POL_TO_SGD_RATE).toFixed(5)}
                </p>
                <p>Posted on: {new Date(job.createdAt).toLocaleDateString()}</p>
                <p>
                  Job Status:{" "}
                  {job.status === JobStatus.POSTED
                    ? "Not funded yet"
                    : job.status}
                </p>
              </div>
            ))}
          </ul>
          <div className="w-[300px] flex justify-center items-center gap-4 mt-4">
            {page > 1 && (
              <Button href={`/job-portal?page=${page - 1}`}>Previous</Button>
            )}{" "}
            Page {page} of {jobs.totalPages}
            {page < jobs.totalPages && (
              <Button href={`/job-portal?page=${page + 1}`}>Next</Button>
            )}
          </div>
          <div className="flex gap-2"></div>
        </>
      )}
    </>
  );
}
