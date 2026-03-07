import { auth } from "@/server/auth";
import CentralContainer from "@/layout/CentralContainer";
import Button from "@/ui/Button";
import { redirect } from "next/navigation";
import { ERROR_TYPE_MAP, getFallbackURL } from "@/utils/errors";
import { ensureAuthorisedAndCompliantUser, logoutToHomeAction } from "@/lib/authActions";
import { UserRole } from "@/generated/prisma-client";
import { getJobListingsAction } from "@/lib/jobActions";
import { JobListings } from "./components";

/**
 * Job Portal Page.
 * Accessible only to authenticated users.
 */
export default async function JobPortal({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; error?: string }>;
  // Next.js passes async search params as strings
}) {

  const CURRENT_PAGE = "job-portal";
  const page = Math.max(1, Number((await searchParams)?.page) || 1);
  const pageSize = 10;

  const error = (await searchParams)?.error;

  const session = await auth();
  if (!session || !session?.user) {
    redirect(getFallbackURL(CURRENT_PAGE, ERROR_TYPE_MAP.UNAUTHORISED));
  }

  // Check if session user is still valid + compliant
  const { user, wallet } = await ensureAuthorisedAndCompliantUser(session.user);

  const jobs = await getJobListingsAction(page, pageSize);

  return (
    <CentralContainer>
      <p>Job portal</p>
      {error && <p className="text-red-500">Error &lt;{error}&gt;.</p>}
      <p>
        Welcome, {user.email} ({user.role}).
      </p>
      {wallet && (
        <p>
          Wallet details:{" "}
          <a
            href={`https://amoy.polygonscan.com/address/${wallet.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-decoration-line text-blue-900"
          >
            {wallet.address}
          </a>
        </p>
      )}

      {user.role === UserRole.EMPLOYER && (
        <Button href={"/job-portal/post-job"}>Post a Job</Button>
      )}

      <JobListings jobs={jobs} page={page} />

      <Button href={"/"}>Back to home</Button>
      <form action={logoutToHomeAction}>
        <Button type="submit">Logout</Button>
      </form>
    </CentralContainer>
  );
}
