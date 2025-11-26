import Link from "next/link";
import { LoginForm } from "./components"
import { Suspense } from "react";

export default function Register() {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full gap-5">
            <p>Registration</p>
            <Link href={'/'}>Back to home</Link>
            <Suspense fallback={<div>Loading...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    )
}