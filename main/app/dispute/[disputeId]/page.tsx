import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { ERROR_TYPE_MAP, getFallbackURL } from "@/utils/errors";
import { ensureAuthorisedAndCompliantUser } from "@/lib/authActions";
import DisputeDetail from "./components/DisputeDetail";

export default async function DisputeDetailsPage({
    params,
}: {
    params: Promise<{ disputeId: string }>;
}) {
    const session = await auth();
    if (!session?.user) {
        redirect(getFallbackURL("dispute", ERROR_TYPE_MAP.UNAUTHORISED));
    }

    const { user } = await ensureAuthorisedAndCompliantUser(session.user);
    const parsedId = Number((await params).disputeId);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
        redirect("/dispute?error=invalid-dispute-id");
    }

    return (
        <main className="min-h-screen bg-[#131314] px-6 pb-14 pt-8 text-[#e5e2e3] md:px-8">
            <div className="mx-auto w-full max-w-[1200px] space-y-6">
                <DisputeDetail disputeId={parsedId} role={user.role} />
            </div>
        </main>
    );
}
