import { getUserOnboardingStatus } from "@/model/user";
import { stringToInt } from "@/utils/conv";
import { ERROR_TYPE_MAP, getFallbackURL } from "@/utils/errors";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import ComplianceContent from "./components/compliance-content";

export default async function CompliancePage() {
  const CURRENT_PAGE = "/compliance";
  const session = await auth();
  if (!session || !session?.user) {
    redirect(getFallbackURL(CURRENT_PAGE, ERROR_TYPE_MAP.UNAUTHORISED));
  }

  const user = session.user;
  if (!user.id) {
    throw new Error("User ID is missing in session: " + JSON.stringify(user));
  }
  const userId = stringToInt(user.id as string);

  const onboardingStatus = await getUserOnboardingStatus(userId);

  return (
    <main className="min-h-screen bg-[#131314] px-6 pb-14 pt-8 text-[#e5e2e3] selection:bg-[#00f2ff] selection:text-[#00363a] md:px-8">
      <div className="mx-auto w-full max-w-[1200px]">
        <ComplianceContent initialStage={onboardingStatus} userId={userId} />
      </div>
    </main>
  );
}
