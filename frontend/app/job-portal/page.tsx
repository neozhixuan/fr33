import { auth, signOut } from "@/server/auth";
import CentralContainer from "@/layout/CentralContainer";
import Button from "@/ui/Button";
import { redirect } from "next/navigation";
import { ERROR_TYPE_MAP, getFallbackURL } from "@/utils/errors";
import { users } from "@prisma/client";
import { getUserByEmail } from "@/model/user";

export default async function JobPortal() {
  // Server component (runs on Node runtime) - Block SSR if auth doesn't pass
  const session = await auth();
  if (!session?.user) {
    redirect(getFallbackURL("job-portal", ERROR_TYPE_MAP.UNAUTHORISED));
  }
  let userModel: users | undefined = undefined;
  if (session && session.user && session.user.email) {
    userModel = await getUserByEmail(session.user.email);
  }
  if (userModel && userModel.registrationStep) {
    const steps = [
      "/",
      "/",
      "/register-step-two",
      "/register-step-three",
      "/job-portal",
    ];
    redirect(steps[userModel.registrationStep]);
  }

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
