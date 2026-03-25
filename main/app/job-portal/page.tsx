import { auth } from "@/server/auth";
import { ensureAuthorisedAndCompliantUser, logoutToHomeAction } from "@/lib/authActions";
import { UserRole } from "@/generated/prisma-client";
import { getJobListingsAction } from "@/lib/jobActions";
import { JobListings } from "./components";
import NextLink from "next/link";
import { getUserWalletValueString } from "@/lib/ether";

/**
 * Job Portal Page.
 * Accessible only to authenticated users.
 */
export default async function JobPortal({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; error?: string; view?: string }>;
  // Next.js passes async search params as strings
}) {
  const resolvedSearchParams = await searchParams;

  const page = Math.max(1, Number(resolvedSearchParams?.page) || 1);
  const pageSize = 10;
  const view = resolvedSearchParams?.view === "my-gigs" ? "my-gigs" : "all";

  const error = resolvedSearchParams?.error;

  // Authenticate user
  const session = await auth();
  const { user, wallet } = await ensureAuthorisedAndCompliantUser(session?.user);

  const jobs = await getJobListingsAction(page, pageSize);
  const shortWallet = wallet?.address
    ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
    : "No wallet";

  let walletPolBalanceLabel = user.role === UserRole.ADMIN ? "Admin has no wallet." : "Retrieving balance...";
  if (wallet?.address) {
    try {
      walletPolBalanceLabel = await getUserWalletValueString(wallet);
    } catch {
      walletPolBalanceLabel = "Error retrieving balance.";
    }
  }

  return (
    <div className="min-h-screen bg-[#131314] text-[#e5e2e3] selection:bg-[#00f2ff] selection:text-[#00363a]">
      <nav className="sticky top-0 z-50 border-b border-[#00f2ff]/10 bg-[#131314]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-[1600px] items-center justify-between px-6 md:px-8">
          <div className="flex items-center gap-8 md:gap-12">
            <NextLink
              href="/"
              className="text-2xl font-black tracking-tighter text-[#e1fdff]"
            >
              fr33
            </NextLink>
            <div className="hidden items-center gap-6 md:flex">
              <NextLink
                href="/job-portal"
                className={`pb-1 text-xs font-semibold uppercase tracking-[0.2em] ${view === "all"
                  ? "border-b-2 border-[#00f2ff] text-[#00f2ff]"
                  : "text-[#e1fdff]/60"
                  }`}
              >
                Find Work
              </NextLink>
              <NextLink
                href="/job-portal?view=my-gigs"
                className={`pb-1 text-xs font-semibold uppercase tracking-[0.2em] ${view === "my-gigs"
                  ? "border-b-2 border-[#00f2ff] text-[#00f2ff]"
                  : "text-[#e1fdff]/60"
                  }`}
              >
                My Gigs
              </NextLink>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <div className="hidden flex-col items-end md:flex">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#b9cacb]">
                Active Wallet
              </span>
              <span className="font-mono text-sm text-[#00f2ff]">{shortWallet}</span>
            </div>

            {user.role === UserRole.EMPLOYER && (
              <NextLink
                href="/job-portal/post-job"
                className="rounded-md bg-[#00f2ff] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#00363a] shadow-[0_0_20px_rgba(0,242,255,0.25)] transition-all hover:brightness-110 md:px-6"
              >
                Post a Job
              </NextLink>
            )}

            {user.role === UserRole.ADMIN && (
              <NextLink
                href="/admin/compliance"
                className="rounded-md bg-red-600 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-[0_0_20px_rgba(220,38,38,0.25)] transition-all hover:brightness-110 md:px-6"
              >
                Compliance Portal
              </NextLink>
            )}

            <form action={logoutToHomeAction}>
              <button
                type="submit"
                className="cursor-pointer rounded-md border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#e1fdff] transition-colors hover:bg-white/10"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="mx-auto flex w-full max-w-[1600px] gap-8 px-6 pb-16 pt-8 md:px-8">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-28 space-y-6">
            <div className="rounded-xl border border-[#00f2ff]/15 bg-[#0e0e0f] p-5">
              <p className="text-lg font-bold text-[#00f2ff]">{user.email.split("@")[0]}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[#b9cacb]">
                {user.role.toLowerCase()}
              </p>
              {wallet && (
                <a
                  href={`https://amoy.polygonscan.com/address/${wallet.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block break-all text-xs text-[#00f2ff] hover:underline"
                >
                  {wallet.address}
                </a>
              )}
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-8">
          {error && (
            <div className="rounded border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">
              Error &lt;{error}&gt;.
            </div>
          )}

          <JobListings
            jobs={jobs}
            page={page}
            userId={user.id}
            walletAddress={wallet?.address ?? ""}
            view={view}
            walletPolBalanceLabel={walletPolBalanceLabel}
          />
        </main>
      </div>

      <footer className="border-t border-white/10 bg-[#0e0e0f]">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-8 py-12 md:grid-cols-4">
          <div>
            <span className="text-xl font-black text-[#e1fdff]">fr33</span>
            <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-[#e5e2e3]/40">
              © 2026 fr33 protocol.
              <br />
              secure. decentralized.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#00f2ff]">Protocol</h4>
            <p className="text-xs uppercase tracking-[0.2em] text-[#e5e2e3]/50">Smart Contracts</p>
            <p className="text-xs uppercase tracking-[0.2em] text-[#e5e2e3]/50">Privacy Node</p>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#00f2ff]">Support</h4>
            <p className="text-xs uppercase tracking-[0.2em] text-[#e5e2e3]/50">Help Center</p>
            <p className="text-xs uppercase tracking-[0.2em] text-[#e5e2e3]/50">Trust & Safety</p>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#00f2ff]">Network</h4>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#7cf39e] shadow-[0_0_8px_#7cf39e]" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#e5e2e3]">Polygon Mainnet</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
