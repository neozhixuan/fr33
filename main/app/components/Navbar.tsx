import NextLink from "next/link";

export default function Navbar() {
    return (
        <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#0a0a0b]/80 backdrop-blur-xl" >
            <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-4 md:px-6">
                <NextLink
                    href="/"
                    className="text-xl font-black  tracking-tighter text-[#e1fdff] md:text-2xl"
                >
                    fr33
                </NextLink>

                <div className="hidden items-center gap-10 md:flex">
                    <a
                        href="#protocol"
                        className="text-[10px] uppercase tracking-[0.25em] text-[#e1fdff]/60 transition-colors hover:text-[#e1fdff]"
                    >
                        Protocol
                    </a>
                    <a
                        href="#governance"
                        className="text-[10px] uppercase tracking-[0.25em] text-[#e1fdff]/60 transition-colors hover:text-[#e1fdff]"
                    >
                        Governance
                    </a>
                </div>

                <div className="flex items-center gap-3 md:gap-6">
                    <NextLink
                        href="/login"
                        className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e1fdff]/70 transition-colors hover:text-[#e1fdff]"
                    >
                        Login
                    </NextLink>
                    <NextLink
                        href="/job-portal"
                        className="border border-[#00f2ff]/30 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#00f2ff] transition-colors hover:bg-[#00f2ff]/10 md:px-5 md:py-2"
                    >
                        Enter Job Portal
                    </NextLink>
                </div>
            </div>
        </nav>
    )
}