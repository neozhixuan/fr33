import CentralContainer from "@/layout/CentralContainer";
import { auth } from "@/server/auth";
import Button from "@/ui/Button";
import { ERROR_TYPE_MAP, getFallbackURL } from "@/utils/errors";
import { redirect } from "next/navigation";
import { redirectUnauthorisedUser } from "../page";
import { getUserByEmail } from "@/model/user";
import { PostJobForm } from "./components";

export default async function PostJobPage() {
  const CURRENT_PAGE = "job-portal/post-job";

  const session = await auth();
  if (!session || !session?.user) {
    redirect(getFallbackURL(CURRENT_PAGE, ERROR_TYPE_MAP.UNAUTHORISED));
  }

  await redirectUnauthorisedUser(session.user);

  const user = await getUserByEmail(session.user.email || "");
  if (!user) {
    redirect(getFallbackURL(CURRENT_PAGE, ERROR_TYPE_MAP.UNAUTHORISED));
  }

  if (user.role !== "EMPLOYER") {
    redirect("/job-portal");
  }

  return (
    <CentralContainer>
      <h1>Post a Job</h1>
      <p>This is where employers can post new job listings.</p>
      <PostJobForm employerId={user.id} />
      <Button href={"/job-portal"}>Back to Job Portal</Button>
    </CentralContainer>
  );
}
