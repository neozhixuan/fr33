import { RegistrationForm } from "./components";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import AuthPageShell from "@/ui/AuthPageShell";

export default async function RegisterPage() {
    const session = await auth();
    if (session && session.user) {
        redirect("/job-portal");
    }

    return (
        <AuthPageShell
            activeTab="register"
            heroTitle="Join the work force on chain."
            heroDescription="Create your identity, choose your role, and start transacting with smart-contract escrows using your very own non-custodial smart wallet."
            features={[
                {
                    label: "Zero-fee",
                    description: "Protocol Settlement",
                    labelColorClass: "text-[#00f2ff]",
                },
                {
                    label: "Portable",
                    description: "Smart Wallets",
                    labelColorClass: "text-[#dcb8ff]",
                },
            ]}
            formContent={<RegistrationForm />}
            footerText="Already registered?"
            footerLinkHref="/login"
            footerLinkText="Login here"
        />
    );
}