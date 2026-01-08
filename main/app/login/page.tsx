import { LoginForm } from "./components";
import { Suspense } from "react";
import Button from "../../ui/Button";
import CentralContainer from "../../layout/CentralContainer";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  if (session && session.user) {
    redirect("/job-portal");
  }

  return (
    <CentralContainer>
      <p>Login</p>
      <Button href={"/"}>Back to home</Button>
      <Button href={"/register"}>No account? Register here</Button>
      {/* Suspense is required for components using useSearchParams, to prevent premature access to params*/}
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </CentralContainer>
  );
}
