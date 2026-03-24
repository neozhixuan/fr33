import NextLink from "next/link";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e5e2e3] selection:bg-[#00f2ff] selection:text-[#00363a]">
      <Navbar />

      <main className="relative">
        {/* Hero Section */}
        <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 pb-6 pt-16 text-center [background-image:radial-gradient(circle_at_2px_2px,rgba(0,242,255,0.04)_1px,transparent_0)] [background-size:60px_60px]">
          <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_50%_50%,rgba(0,242,255,0.14)_0%,rgba(119,1,208,0.08)_40%,transparent_100%)]" />

          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 select-none md:h-[620px] md:w-[620px]">
            <div className="absolute inset-0 rounded-full border border-[#e1fdff]/10" />
            <div className="absolute inset-12 rounded-full border border-[#7701d0]/20 [animation:spin_60s_linear_infinite]">
              <div className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#dcb8ff] blur-[2px]" />
            </div>
            <div className="absolute inset-24 rounded-full border border-[#00f2ff]/25 [animation:spin_45s_linear_infinite_reverse]">
              <div className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#00f2ff] blur-[3px]" />
            </div>
            <div className="absolute inset-40 rounded-full border border-white/10" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#00f2ff]/20 via-transparent to-[#7701d0]/20 blur-[120px] opacity-40" />
          </div>

          <div className="relative z-10 mx-auto max-w-5xl">

            <h1 className="mb-6 text-5xl font-black  leading-none tracking-tighter text-[#e1fdff] drop-shadow-[0_0_40px_rgba(0,242,255,0.35)] sm:text-6xl md:text-8xl">
              fr33
            </h1>

            <h2 className="mx-auto mb-5 max-w-4xl text-2xl font-bold leading-tight tracking-tight text-[#e5e2e3] sm:text-3xl md:text-5xl">
              Decentralized Work Force.
              <br />
              <span className="bg-gradient-to-r from-[#00f2ff] via-[#e1fdff] to-[#dcb8ff] bg-clip-text text-transparent">
                Cryptographic Accountability.
              </span>
            </h2>

            <p className="mx-auto mb-8 max-w-2xl text-sm font-light leading-relaxed tracking-wide text-[#b9cacb] md:text-lg">
              The high-performance protocol for the global freelance economy.
              Smart-contract escrow, merit-based reputation, and zero-fee
              settlement.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 md:flex-row md:gap-6">
              <NextLink
                href="/job-portal"
                className="w-full border border-transparent bg-[#00f2ff] px-7 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#00363a] shadow-[0_0_24px_rgba(0,242,255,0.2)] transition-transform hover:scale-105 sm:w-auto"
              >
                Enter Job Portal
              </NextLink>
              <NextLink
                href="/compliance"
                className="w-full border border-white/15 px-7 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#e1fdff] transition-colors hover:bg-white/5 sm:w-auto"
              >
                Explore Compliance
              </NextLink>
            </div>
          </div>

          <a
            href="#protocol"
            className="absolute bottom-5 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5 opacity-40 transition-opacity hover:opacity-100"
          >
            <span className="text-[9px] uppercase tracking-[0.28em]">
              explore network
            </span>
            <span className="text-base">↓</span>
          </a>
        </section>

        {/* Protocol Section */}
        <section id="protocol" className="mx-auto max-w-[1400px] px-8 py-24 md:py-32">
          <div className="grid grid-cols-1 gap-px border border-white/10 bg-white/10 md:grid-cols-3">
            <article className="bg-[#0a0a0b] p-10 transition-colors duration-500 hover:bg-[#00f2ff]/10 md:p-14">
              <h3 className="mb-4 text-xl font-bold uppercase tracking-[0.15em] text-[#00f2ff] md:text-2xl">
                Smart Escrow
              </h3>
              <p className="text-sm leading-relaxed text-[#b9cacb] md:text-base">
                Self-executing contracts secure project funds. Capital is
                released programmatically upon milestone verification.
              </p>
            </article>

            <article className="bg-[#0a0a0b] p-10 transition-colors duration-500 hover:bg-[#7701d0]/10 md:p-14">
              <h3 className="mb-4 text-xl font-bold uppercase tracking-[0.15em] text-[#dcb8ff] md:text-2xl">
                On-Chain Trust
              </h3>
              <p className="text-sm leading-relaxed text-[#b9cacb] md:text-base">
                Immutable reputation scores built on verified work history with
                credentials that travel across the entire Web3 ecosystem.
              </p>
            </article>

            <article className="bg-[#0a0a0b] p-10 transition-colors duration-500 hover:bg-[#7cf39e]/10 md:p-14">
              <h3 className="mb-4 text-xl font-bold uppercase tracking-[0.15em] text-[#7cf39e] md:text-2xl">
                Fair Resolution
              </h3>
              <p className="text-sm leading-relaxed text-[#b9cacb] md:text-base">
                Neutral, fast, and secure dispute management through
                decentralized arbitration for a truly borderless economy.
              </p>
            </article>
          </div>
        </section>

        {/* Network Section */}
        <section
          id="network"
          className="border-y border-white/10 bg-[#0e0e0f] px-8 py-16 md:py-24"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-10">
            {[
              ["$142M+", "Volume Secured"],
              ["28.4K", "Active Nodes"],
              ["0.0%", "Platform Fees"],
              ["12ms", "Settlement Time"],
            ].map(([value, label]) => (
              <div key={label} className="flex min-w-[180px] flex-col">
                <span className="mb-2 text-3xl font-bold text-[#e5e2e3] md:text-4xl">
                  {value}
                </span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#00f2ff]">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Governance Section */}
        <section
          id="governance"
          className="relative overflow-hidden px-8 py-28 md:py-36"
        >
          <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[1000px] -translate-x-1/2 rounded-full bg-[#00f2ff]/10 blur-[120px]" />
          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <h2 className="mb-8 text-4xl font-black tracking-tighter text-[#e5e2e3] md:text-7xl">
              Accelerate the decentralized future.
            </h2>
            <div className="flex flex-col items-center justify-center gap-5 md:flex-row md:gap-8">
              <NextLink
                href="/register"
                className="w-full bg-[#00f2ff] px-12 py-5 text-xs font-bold uppercase tracking-[0.35em] text-[#00363a] shadow-[0_0_30px_rgba(0,242,255,0.2)] transition-transform hover:scale-105 md:w-auto"
              >
                Launch Application
              </NextLink>
              <NextLink
                href="/job-portal/post-job"
                className="w-full border border-white/20 px-12 py-5 text-xs font-bold uppercase tracking-[0.35em] text-[#e5e2e3] transition-colors hover:bg-white/5 md:w-auto"
              >
                Post a Job
              </NextLink>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
