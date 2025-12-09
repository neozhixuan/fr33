import Button from "@/ui/Button";
import CentralContainer from "../../layout/CentralContainer";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { getUserByEmail } from "@/model/user";
import { ERROR_TYPE_MAP, getFallbackURL } from "@/utils/errors";
import { users } from "@prisma/client";
import MockKYCDetails from "./components/mock-kyc-details";

export default async function RegisterStepTwoPage() {
  const session = await auth();
  if (!session?.user) {
    redirect(getFallbackURL("register-step-two", ERROR_TYPE_MAP.UNAUTHORISED));
  }
  let userModel: users | undefined = undefined;
  if (session && session.user && session.user.email) {
    userModel = await getUserByEmail(session.user.email);
  }
  if (!userModel) {
    redirect(getFallbackURL("register-step-two", ERROR_TYPE_MAP.UNAUTHORISED));
  }
  if (userModel.registrationStep + 1 !== 2) {
    // TODO: Step 2 error proper handling
    redirect(
      getFallbackURL("register-step-two", ERROR_TYPE_MAP.WRONG_STEP_ERROR)
    );
  }

  return (
    <CentralContainer>
      <p>Registration Step Two</p>
      <Button href={"/"}>Back to home</Button>
      <MockKYCDetails userEmail={userModel.email} />
    </CentralContainer>
  );
}
