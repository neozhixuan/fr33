'use client';

import { useActionState } from 'react';
import { authenticate } from '@/app/lib/actions';
import Button from "@/app/ui/Button"
import { useSearchParams } from 'next/navigation';

export function LoginForm() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/job-portal';
    const [errorMessage, formAction, isPending] = useActionState(
        authenticate,
        undefined,
    );

    const handleSubmit = () => {
        console.log("test")
    }

    return (
        <form action={formAction} className="space-y-3">
            <div className="w-full flex flex-col gap-5">
                <div className="relative">
                    <label
                        className="mb-3 mt-5"
                        htmlFor="email"
                    >
                        Email
                    </label>

                    <input
                        className="peer block w-full rounded-md border border-gray-200 py-[9px] text-sm outline-2"
                        id="email"
                        type="email"
                        name="email"
                        placeholder="Enter your email address"
                        required
                    />
                </div>

                <div className="relative">
                    <label
                        className="mb-3 mt-5"
                        htmlFor="password"
                    >
                        Password
                    </label>
                    <input
                        className="peer block w-full rounded-md border border-gray-200 py-[9px] text-sm outline-2"
                        id="password"
                        type="password"
                        name="password"
                        placeholder="Enter your password"
                        required
                    />
                </div>

                <div
                    className="flex h-8 items-end space-x-1"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    <input type="hidden" name="redirectTo" value={callbackUrl} />
                    <Button onClick={handleSubmit} type="submit" aria-disabled={isPending}>
                        Log in
                    </Button>

                    {errorMessage && (
                        <>
                            <p>{errorMessage}</p>
                        </>
                    )}
                </div>
            </div>
        </form>
    )

}