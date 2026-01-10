import { auth } from "@/server/auth";
import CentralContainer from "@/layout/CentralContainer";
import Button from "@/ui/Button";
import { redirect } from "next/navigation";
import { ERROR_TYPE_MAP, getFallbackURL } from "@/utils/errors";
import { getUserAuthorisationStatus } from "@/model/user";
import { stringToInt } from "@/utils/conv";
import { logoutToHomeAction } from "@/lib/authActions";
import { User } from "next-auth";
import { UserRole, User as DBUser, Wallet } from "@/generated/prisma-client";
import { getJobListingsAction } from "@/lib/jobActions";
import { JobListings } from "./components";

/**
 * Redirects unauthorised users to the appropriate fallback URL.
 * Server component (runs on Node runtime) - Block SSR if auth doesn't pass
 */
export async function ensureAuthorisedAndCompliantUser(
  sessionUser: User
): Promise<{ user: DBUser; wallet: Wallet | undefined }> {
  if (!sessionUser.id) {
    throw new Error(
      "User ID is missing in session: " + JSON.stringify(sessionUser)
    );
  }
  const userId = stringToInt(sessionUser.id as string);
  const { user, wallet, isCompliant } =
    await getUserAuthorisationStatus(userId);
  if (!user) {
    // Session user is no longer valid
    const target = getFallbackURL("job-portal", ERROR_TYPE_MAP.UNAUTHORISED);
    // Redirect to a Route Handler that clears cookies then redirects
    redirect(`/api/logout?redirectTo=${encodeURIComponent(target)}`);
  }

  if (!isCompliant) {
    // Session user needs to complete compliance
    redirect("/compliance");
  }

  return { user, wallet };
}

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

  // 1. Check for session and user
  const session = await auth();
  if (!session || !session?.user) {
    redirect(getFallbackURL(CURRENT_PAGE, ERROR_TYPE_MAP.UNAUTHORISED));
  }
  console.log(session);

  // 2. Check if session user is still valid + compliant
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
