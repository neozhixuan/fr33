import { auth } from "@/server/auth";
import Button from "@/ui/Button";
import { ERROR_TYPE_MAP, getFallbackURL } from "@/utils/errors";
import { redirect } from "next/navigation";
import { ensureAuthorisedAndCompliantUser } from "@/lib/authActions";
import { PostJobForm } from "./components";

export default async function PostJobPage() {
  const CURRENT_PAGE = "job-portal/post-job";

  const session = await auth();
  if (!session || !session?.user) {
    redirect(getFallbackURL(CURRENT_PAGE, ERROR_TYPE_MAP.UNAUTHORISED));
  }

  const { user, wallet } = await ensureAuthorisedAndCompliantUser(session.user);
  if (user.role !== "EMPLOYER") {
    redirect("/job-portal");
  }

  return (
    <main className="min-h-screen bg-[#131314] px-6 pb-14 pt-8 text-[#e5e2e3] md:px-8">
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        <Button
          href="/job-portal"
          className="border border-white/20 bg-transparent px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#e5e2e3]"
        >
          ← Back to Job Portal
        </Button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="space-y-4 rounded-xl border border-white/10 bg-[#1c1b1c] p-6 lg:col-span-1">
            <h1 className="text-2xl font-black tracking-tight text-[#e5e2e3]">Post a new job</h1>
            <p className="text-sm leading-relaxed text-[#b9cacb]">
              Create a listing, set the payout in SGD, and fund escrow once a suitable worker is identified.
            </p>
            {wallet ? (
              <p className="break-all text-xs text-[#b9cacb]">
                Employer wallet:{" "}
                <a
                  href={`https://amoy.polygonscan.com/address/${wallet.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00f2ff] hover:underline"
                >
                  {wallet.address}
                </a>
              </p>
            ) : (
              <p className="text-sm text-red-300">Unexpected error: wallet not found for this user.</p>
            )}

            <div className="rounded-lg border border-[#00f2ff]/15 bg-[#131314] p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#b9cacb]">Tips</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-[#b9cacb]">
                <li>Use clear scope and deliverables.</li>
                <li>Add acceptance criteria in the description.</li>
                <li>Set realistic budgets for faster matches.</li>
              </ul>
            </div>
          </section>

          <section className="rounded-xl border border-[#00f2ff]/15 bg-[#201f20]/75 p-6 shadow-[0_0_45px_rgba(0,242,255,0.05)] lg:col-span-2 md:p-8">
            {wallet ? (
              <PostJobForm employerId={user.id} wallet={wallet} />
            ) : (
              <p className="text-sm text-red-300">Unexpected error: Wallet not found for this user.</p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
