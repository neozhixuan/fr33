export default function Footer() {
    return (
        <footer className="border-t border-white/10 bg-[#0a0a0b] py-14">
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-8 md:grid-cols-4">
                <div>
                    <div className="mb-4 text-2xl font-black uppercase tracking-tighter text-[#e1fdff]">
                        fr33
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.25em] leading-relaxed text-[#e5e2e3]/40">
                        © 2026 fr33 protocol.
                        <br />
                        Architecting autonomy.
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#00f2ff]">
                        Protocol
                    </h4>
                    <a className="text-xs uppercase tracking-[0.2em] text-[#e5e2e3]/50 transition-colors hover:text-[#00f2ff]" href="#">
                        GitHub
                    </a>
                    <a className="text-xs uppercase tracking-[0.2em] text-[#e5e2e3]/50 transition-colors hover:text-[#00f2ff]" href="#">
                        Specifications
                    </a>
                    <a className="text-xs uppercase tracking-[0.2em] text-[#e5e2e3]/50 transition-colors hover:text-[#00f2ff]" href="#">
                        Audits
                    </a>
                </div>

                <div className="flex flex-col gap-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#00f2ff]">
                        Ecosystem
                    </h4>
                    <a className="text-xs uppercase tracking-[0.2em] text-[#e5e2e3]/50 transition-colors hover:text-[#00f2ff]" href="#">
                        DAO
                    </a>
                    <a className="text-xs uppercase tracking-[0.2em] text-[#e5e2e3]/50 transition-colors hover:text-[#00f2ff]" href="#">
                        Grants
                    </a>
                    <a className="text-xs uppercase tracking-[0.2em] text-[#e5e2e3]/50 transition-colors hover:text-[#00f2ff]" href="#">
                        Status
                    </a>
                </div>

                <div className="flex flex-col gap-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#00f2ff]">
                        Social
                    </h4>
                    <a className="text-xs uppercase tracking-[0.2em] text-[#e5e2e3]/50 transition-colors hover:text-[#00f2ff]" href="#">
                        X / Twitter
                    </a>
                    <a className="text-xs uppercase tracking-[0.2em] text-[#e5e2e3]/50 transition-colors hover:text-[#00f2ff]" href="#">
                        Discord
                    </a>
                    <a className="text-xs uppercase tracking-[0.2em] text-[#e5e2e3]/50 transition-colors hover:text-[#00f2ff]" href="#">
                        Mirror
                    </a>
                </div>
            </div>
        </footer>
    )
}