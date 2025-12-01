'use client';

import { registrationAction } from "@/lib/actions";
import Button from "@/ui/Button";
import { useActionState } from "react";

export function RegistrationForm() {
    const callbackUrl = '/next-step';

    const [registrationErrorMessage, registerAction, isRegistrationPending] = useActionState(
        registrationAction,
        undefined,
    );

    return (
        <form action={registerAction} className="space-y-3 position-relative  w-1/3">
            {registrationErrorMessage && (
                <div role="alert" className="text-red-500 text-sm position-absolute top-0 left-0 w-full">{registrationErrorMessage}</div>
            )}
            <div className="w-full flex flex-col gap-5">
                <div className="relative">
                    <label
                        className="mb-3 mt-5"
                        htmlFor="name"
                    >
                        Name
                    </label>

                    <input
                        className="peer block w-full rounded-md border border-gray-200 py-[9px] text-sm outline-2"
                        id="name"
                        type="text"
                        name="name"
                        placeholder="Enter your name"
                        required
                    />
                </div>
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
                    <input type="hidden" name="redirectTo" value={callbackUrl} />
                    <Button type="submit" aria-disabled={isRegistrationPending} disabled={isRegistrationPending}>
                        Register
                    </Button>

                </div>
                {registrationErrorMessage && (
                    <>
                        <p>{registrationErrorMessage}</p>
                    </>
                )}
            </div>
        </form>

    )
}