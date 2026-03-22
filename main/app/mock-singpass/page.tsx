import { SingpassContent } from "./components/singpass-content";
import { Suspense } from "react";

export default function MockSingpassPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 text-[#1f2937] md:px-8">
      <Suspense
        fallback={
          <div className="mx-auto mt-16 max-w-3xl rounded-xl border border-[#d1d5db] bg-white p-6 text-sm text-[#4b5563] shadow-sm">
            Loading Singpass mock...
          </div>
        }
      >
        <SingpassContent />
      </Suspense>
    </main>
  );
}
