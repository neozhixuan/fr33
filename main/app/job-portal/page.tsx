import { auth, signOut } from "@/server/auth";
import CentralContainer from "@/layout/CentralContainer";
import Button from "@/ui/Button";
import { redirect } from "next/navigation";
import { ERROR_TYPE_MAP, getFallbackURL } from "@/utils/errors";
import { getUserIsCompliant } from "@/model/user";
import { stringToInt } from "@/utils/conv";

/**
 * Redirects unauthorised users to the appropriate fallback URL.
 * Server component (runs on Node runtime) - Block SSR if auth doesn't pass
 */
async function redirectUnauthorisedUser() {
  const CURRENT_PAGE = "job-portal";

  const session = await auth();
  if (!session || !session?.user) {
    redirect(getFallbackURL(CURRENT_PAGE, ERROR_TYPE_MAP.UNAUTHORISED));
  }

  const user = session.user;
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
export default async function JobPortal() {
  await redirectUnauthorisedUser();

  return (
    <CentralContainer>
      <p>Job portal</p>
      <Button href={"/"}>Back to home</Button>
      <form action={logoutAction}>
        <Button type="submit">Logout</Button>
      </form>
    </CentralContainer>
  );
}

async function logoutAction() {
  "use server";

  await signOut({ redirectTo: "/" });
}
