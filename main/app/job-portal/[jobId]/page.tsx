"use server";

import { JobStatus, UserRole } from "@/generated/prisma-client";
import { getJobDetailsAction } from "@/lib/jobActions";
import { auth } from "@/server/auth";
import { getFallbackURL } from "@/utils/errors";
import { redirect } from "next/navigation";
import EmployerActions from "./components/EmployerActions";
import Button from "@/ui/Button";
import { ensureAuthorisedAndCompliantUser } from "@/lib/authActions";
import WorkerActions from "./components/WorkerActions";
import MainJobSection from "./components/MainJobSection";

type JobPageProps = {
  params: Promise<{ jobId: string }>;
};

export default async function JobPage({ params }: JobPageProps) {
  const { jobId } = await params;

  const session = await auth();
  if (!session || !session?.user || !session?.user?.id) {
    redirect(getFallbackURL("job-portal", "unauthorised"));
  }

  const userId = parseInt(session.user.id as string);

  const { user, wallet } = await ensureAuthorisedAndCompliantUser(session.user);

  const job = await getJobDetailsAction(parseInt(jobId));
  if (!job) {
    redirect("/job-portal?error=job-not-found");
  }

  // Convert Decimal to number for Client Component
  const jobForClient = {
    ...job,
    amount:
      typeof job.amount === "object"
        ? job.amount.toNumber?.()
        : Number(job.amount),
  };

  const workerCanAct =
    user.role === UserRole.WORKER &&
    (job.status === JobStatus.FUNDED ||
      job.status === JobStatus.IN_PROGRESS ||
      job.status === JobStatus.PENDING_APPROVAL);

  return (
    <main className="min-h-screen bg-[#131314] px-6 pb-14 pt-8 text-[#e5e2e3] md:px-8">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            href="/job-portal"
            className="cursor-pointer border border-white/20 bg-transparent px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#e5e2e3] my-5"
          >
            ← Back to Job Portal
          </Button>
          <p className="text-xs uppercase tracking-[0.2em] text-[#b9cacb]">
            Role: <span className="text-[#00f2ff]">{user.role.toLowerCase()}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <MainJobSection job={jobForClient} />
          </div>

          <aside className="space-y-6 xl:col-span-4">
            {userId === job.employerId && (
              <section className="rounded-xl border border-[#00f2ff]/15 bg-[#1c1b1c]/80 p-5">
                <h2 className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-[#00f2ff]">
                  Employer Actions
                </h2>
                {wallet ? (
                  <>
                    <p className="mb-4 text-xs text-[#b9cacb]">Use these controls to fund, approve release, or cancel the job.</p>
                    <p className="mb-4 break-all text-xs text-[#b9cacb]">
                      Wallet:{" "}
                      <a
                        href={`https://amoy.polygonscan.com/address/${wallet.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#00f2ff] hover:underline"
                      >
                        {wallet.address}
                      </a>
                    </p>
                    <EmployerActions
                      job={jobForClient}
                      employerId={userId}
                      wallet={wallet}
                    />
                  </>
                ) : (
                  <p className="text-sm text-red-300">Unexpected error: no wallet linked.</p>
                )}
              </section>
            )}

            {workerCanAct && (
              <section className="rounded-xl border border-[#00f2ff]/15 bg-[#1c1b1c]/80 p-5">
                <h2 className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-[#00f2ff]">
                  Worker Actions
                </h2>
                {wallet ? (
                  <>
                    <p className="mb-4 text-xs text-[#b9cacb]">Accept the assignment and request fund release when work is complete.</p>
                    <p className="mb-4 break-all text-xs text-[#b9cacb]">
                      Wallet:{" "}
                      <a
                        href={`https://amoy.polygonscan.com/address/${wallet.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#00f2ff] hover:underline"
                      >
                        {wallet.address}
                      </a>
                    </p>
                    <WorkerActions
                      job={jobForClient}
                      workerId={userId}
                      workerWallet={wallet}
                    />
                  </>
                ) : (
                  <p className="text-sm text-red-300">Unexpected error: no wallet linked.</p>
                )}
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
