import { auth } from "@/server/auth";
import CentralContainer from "@/layout/CentralContainer";
import Button from "@/ui/Button";
import { redirect } from "next/navigation";
import { ERROR_TYPE_MAP, getFallbackURL } from "@/utils/errors";
import { getUserByEmail, getUserIsCompliant } from "@/model/user";
import { stringToInt } from "@/utils/conv";
import { logoutAction } from "@/lib/authActions";
import { User } from "next-auth";
import { UserRole } from "@/generated/prisma-client";
import { getJobListingsAction } from "@/lib/jobActions";
import { JobListings } from "./components";

/**
 * Redirects unauthorised users to the appropriate fallback URL.
 * Server component (runs on Node runtime) - Block SSR if auth doesn't pass
 */
export async function redirectUnauthorisedUser(user: User) {
  if (!user.id) {
    throw new Error("User ID is missing in session: " + JSON.stringify(user));
  }
  const userId = stringToInt(user.id as string);

  const isCompliant = await getUserIsCompliant(userId);
  if (!isCompliant) {
    redirect("/compliance");
  }

  return;
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
  const pageSize = 1;

  const error = (await searchParams)?.error;

  const session = await auth();
  if (!session || !session?.user) {
    redirect(getFallbackURL(CURRENT_PAGE, ERROR_TYPE_MAP.UNAUTHORISED));
  }
  await redirectUnauthorisedUser(session.user);
  const user = await getUserByEmail(session.user.email || "");
  if (!user) {
    redirect(getFallbackURL(CURRENT_PAGE, ERROR_TYPE_MAP.UNAUTHORISED));
  }

  const jobs = await getJobListingsAction(page, pageSize);

  return (
    <CentralContainer>
      <p>Job portal</p>
      <p className="text-red-500">Error &lt;{error}&gt;.</p>
      <p>
        Welcome, {user.email} ({user.role})
      </p>

      {user.role === UserRole.EMPLOYER && (
        <Button href={"/job-portal/post-job"}>Post a Job</Button>
      )}

      <JobListings jobs={jobs} page={page} />

      <Button href={"/"}>Back to home</Button>
      <form action={logoutAction}>
        <Button type="submit">Logout</Button>
      </form>
    </CentralContainer>
  );
}
