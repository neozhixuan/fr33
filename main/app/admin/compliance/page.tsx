import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma-client";
import { ensureAuthorisedAndCompliantUser } from "@/lib/authActions";
import CompliancePortalContent from "./components/CompliancePortalContent";

export default async function CompliancePortalPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/");
    }

    const { user } = await ensureAuthorisedAndCompliantUser(session.user);

    // Redirect non-admins
    if (user.role !== UserRole.ADMIN) {
        redirect("/");
    }

    return (
        <main className="min-h-screen bg-[#0f0f10] p-6">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white">Compliance Portal</h1>
                    <p className="mt-2 text-sm text-gray-400">
                        Monitor and manage user compliance cases
                    </p>
                </div>

                <CompliancePortalContent />
            </div>
        </main>
    );
}
