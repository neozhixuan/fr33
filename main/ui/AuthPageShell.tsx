import NextLink from "next/link";
import { ReactNode } from "react";

type AuthFeature = {
    label: string;
    description: string;
    labelColorClass: string;
};

type AuthPageShellProps = {
    heroTitle: string;
    heroDescription: string;
    features: [AuthFeature, AuthFeature];
    activeTab: "login" | "register";
    formContent: ReactNode;
    footerText: string;
    footerLinkHref: string;
    footerLinkText: string;
};

export default function AuthPageShell({
    heroTitle,
    heroDescription,
    features,
    activeTab,
    formContent,
    footerText,
    footerLinkHref,
    footerLinkText,
}: AuthPageShellProps) {
    const isLogin = activeTab === "login";

    return (
        <main className="min-h-screen bg-[#131314] text-[#e5e2e3] selection:bg-[#00f2ff] selection:text-[#00363a]">
            <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
                <section className="relative hidden overflow-hidden border-r border-white/10 lg:flex lg:flex-col lg:justify-center lg:px-14 xl:px-20">
                    <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgba(0,242,255,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,242,255,0.2)_1px,transparent_1px)] [background-size:42px_42px]" />
                    <div className="pointer-events-none absolute -left-24 top-20 h-96 w-96 rounded-full bg-[#7701d0]/15 blur-[120px]" />
                    <div className="pointer-events-none absolute bottom-10 right-10 h-72 w-72 rounded-full bg-[#00f2ff]/15 blur-[100px]" />

                    <div className="relative z-10 max-w-xl">
                        <NextLink
                            href="/"
                            className="mb-8 inline-block text-6xl font-black tracking-tighter text-[#e1fdff]"
                        >
                            fr33
                        </NextLink>
                        <div className="mb-8 h-1 w-24 bg-[#00f2ff]" />
                        <h1 className="mb-6 text-4xl font-bold leading-tight">{heroTitle}</h1>
                        <p className="mb-10 text-lg leading-relaxed text-[#b9cacb]">{heroDescription}</p>

                        <div className="grid grid-cols-2 gap-6">
                            {features.map((feature) => (
                                <div
                                    key={feature.label}
                                    className="rounded-lg border border-white/10 bg-white/5 p-4"
                                >
                                    <p
                                        className={`text-xs font-semibold uppercase tracking-[0.2em] ${feature.labelColorClass}`}
                                    >
                                        {feature.label}
                                    </p>
                                    <p className="mt-1 text-sm text-[#b9cacb]">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="flex items-center justify-center p-6 lg:p-10">
                    <div className="w-full max-w-md">
                        <div className="mb-8 text-center lg:hidden">
                            <NextLink
                                href="/"
                                className="text-4xl font-black tracking-tighter text-[#e1fdff]"
                            >
                                fr33
                            </NextLink>
                        </div>

                        <div className="rounded-xl border border-[#00f2ff]/20 bg-[#1c1b1c]/80 p-7 shadow-[0_0_40px_rgba(0,242,255,0.08)] backdrop-blur-xl md:p-8">
                            <div className="mb-7 flex gap-8 border-b border-white/10">
                                {isLogin ? (
                                    <>
                                        <span className="border-b-2 border-[#00f2ff] pb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#00f2ff]">
                                            Login
                                        </span>
                                        <NextLink
                                            href="/register"
                                            className="pb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#b9cacb] transition-colors hover:text-[#e5e2e3]"
                                        >
                                            Sign Up
                                        </NextLink>
                                    </>
                                ) : (
                                    <>
                                        <NextLink
                                            href="/login"
                                            className="pb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#b9cacb] transition-colors hover:text-[#e5e2e3]"
                                        >
                                            Login
                                        </NextLink>
                                        <span className="border-b-2 border-[#00f2ff] pb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#00f2ff]">
                                            Sign Up
                                        </span>
                                    </>
                                )}
                            </div>

                            {formContent}

                            <p className="mt-7 text-center text-xs text-[#b9cacb]/70">
                                {footerText}{" "}
                                <NextLink href={footerLinkHref} className="text-[#00f2ff] hover:underline">
                                    {footerLinkText}
                                </NextLink>
                                {" "}or go{" "}
                                <NextLink href="/" className="text-[#00f2ff] hover:underline">
                                    back home
                                </NextLink>
                                .
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
