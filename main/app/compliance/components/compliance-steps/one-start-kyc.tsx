import Button from "@/ui/Button";
import { redirect } from "next/navigation";

export function StartKYC() {
  return (
    <>
      <p>Please complete identity verification via Singpass.</p>
      <Button onClick={() => redirect("/mock-singpass?callback=/compliance")}>
        Start KYC
      </Button>
    </>
  );
}
