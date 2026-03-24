import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { ERROR_TYPE_MAP, getFallbackURL } from "@/utils/errors";
import { ensureAuthorisedAndCompliantUser } from "@/lib/authActions";
import DisputeBoard from "./components/DisputeBoard";

export default async function DisputePage({
    searchParams,
}: {
    searchParams?: Promise<{ jobId?: string }>;
}) {
    const session = await auth();
    if (!session?.user) {
        redirect(getFallbackURL("dispute", ERROR_TYPE_MAP.UNAUTHORISED));
    }

    const { user } = await ensureAuthorisedAndCompliantUser(session.user);
    const params = await searchParams;
    const jobId = Number(params?.jobId);

    return (
        <main className="min-h-screen bg-[#131314] px-6 pb-14 pt-8 text-[#e5e2e3] md:px-8">
            <div className="mx-auto w-full max-w-[1200px] space-y-6">
                <div className="rounded-xl border border-[#00f2ff]/15 bg-[#1c1b1c]/80 p-6">
                    <h1 className="text-2xl font-black tracking-tight text-[#e5e2e3] md:text-3xl">
                        Dispute Center
                    </h1>
                    <p className="mt-2 text-sm text-[#b9cacb]">
                        Track dispute progress, review evidence, and resolve active cases.
                    </p>
                </div>

                <DisputeBoard
                    role={user.role}
                    initialJobId={Number.isInteger(jobId) && jobId > 0 ? jobId : undefined}
                />
            </div>
        </main>
    );
}
