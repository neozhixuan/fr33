'use client';

import { useActionState } from 'react';
import { authenticateAction } from '@/lib/actions';
import Button from "@/ui/Button"
import { useSearchParams } from 'next/navigation';
import { getLoginErrorMsg } from '@/lib/util';

export function LoginForm() {
    const redirectURL = "/job-portal"

    const searchParams = useSearchParams();
    const authorisationError = searchParams.get("error");
    const from = searchParams.get("from");
    const authorisationErrorMessage: string = authorisationError ?
        getLoginErrorMsg(from!, authorisationError) : "" // Note: Accessing a missing key returns undefined

    // Creates a component state tuple with three elements: the current state, a function to update the state, and a boolean indicating if the action is pending.
    // Pass in an action and an initial state
    const [loginErrorMessage, loginAction, isLoginPending] = useActionState(
        authenticateAction,
        undefined,
    );

    return (
        <form action={loginAction} className="space-y-3 position-relative w-1/3">
            {authorisationErrorMessage && (
                <div role="alert" className="text-red-500 text-sm position-absolute top-0 left-0 w-full">{authorisationErrorMessage}</div>
            )}
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
                    className="flex justify-center h-8 items-end space-x-1"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {/* Hidden input to pass redirectTo to server action */}
                    <input type="hidden" name="redirectTo" value={redirectURL} />
                    <Button type="submit" aria-disabled={isLoginPending} disabled={isLoginPending}>
                        Log in
                    </Button>
                </div>

                {loginErrorMessage && (
                    <>
                        <p>{loginErrorMessage}</p>
                    </>
                )}
            </div>
        </form>
    )

}