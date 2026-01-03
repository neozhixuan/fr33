import CentralContainer from "@/layout/CentralContainer";
import { SingpassContent } from "./components/singpass-content";
import { Suspense } from "react";

export default function MockSingpassPage() {
  return (
    <CentralContainer>
      <Suspense fallback={<div>Loading...</div>}>
        <SingpassContent />
      </Suspense>
    </CentralContainer>
  );
}
