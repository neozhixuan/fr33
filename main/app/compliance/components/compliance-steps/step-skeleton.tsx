
type StepSkeletonProps = {
    stepName: string;
    stepDescription: string;
    children: React.ReactNode;
}

export default function StepSkeleton({ stepName, stepDescription, children }: StepSkeletonProps) {
    return (
        <section className="rounded-xl border border-[#00f2ff]/15 bg-[#1c1b1c] p-6 md:p-8">
            <h2 className="text-xl font-black tracking-tight text-[#e5e2e3] md:text-2xl">{stepName}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#b9cacb]">
                {stepDescription}
            </p>
            {children}
        </section>
    )
}