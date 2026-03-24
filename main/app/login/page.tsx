import { LoginForm } from "./components";
import { Suspense } from "react";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import AuthPageShell from "@/ui/AuthPageShell";

export default async function LoginPage() {
  const session = await auth();
  if (session && session.user) {
    redirect("/job-portal");
  }

  return (
    <AuthPageShell
      activeTab="login"
      heroTitle="Secure access to the hybrid Web2-Web3 work protocol."
      heroDescription="Log in to manage jobs, escrow payments, with compliance and cryptographic accountability."
      features={[
        {
          label: "Secure",
          description: "Escrow Contracts",
          labelColorClass: "text-[#00f2ff]",
        },
        {
          label: "Near Instant",
          description: "Wallet Settlements",
          labelColorClass: "text-[#dcb8ff]",
        },
      ]}
      formContent={
        <Suspense fallback={<div className="text-sm text-[#b9cacb]">Loading...</div>}>
          <LoginForm />
        </Suspense>
      }
      footerText="No account?"
      footerLinkHref="/register"
      footerLinkText="Create one"
    />
  );
}
