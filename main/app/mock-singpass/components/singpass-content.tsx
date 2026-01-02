"use client";

import Button from "@/ui/Button";
import { redirect, useSearchParams } from "next/navigation";

export function SingpassContent() {
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callback");

  const handleAgree = () => {
    redirect(`${callbackURL}?code=AUTHORIZATION_CODE&state=xyz`);
  };

  return (
    <>
      <h1>Mock Singpass Page</h1>
      <p>This is a mock Singpass identity verification page.</p>
      <hr />
      <p>Agree to share your data below?</p>
      <ul>
        <li>Name: John Doe</li>
      </ul>
      <div className="flex flex-row gap-5">
        <Button onClick={handleAgree} className="bg-green-500">
          Agree
        </Button>
        <Button>Cancel</Button>
      </div>
    </>
  );
}
