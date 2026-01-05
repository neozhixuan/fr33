"use client";

import { UserRole } from "@/generated/prisma-client";
import { registrationAction } from "@/lib/authActions";
import Button from "@/ui/Button";
import FormInput from "@/ui/FormInput";
import { useActionState } from "react";

export function RegistrationForm() {
  const [registrationErrorMessage, registerAction, isRegistrationPending] =
    useActionState(registrationAction, undefined);

  return (
    <form
      action={registerAction}
      className="space-y-3 position-relative  w-1/3"
    >
      {registrationErrorMessage && (
        <div
          role="alert"
          className="text-red-500 text-sm position-absolute top-0 left-0 w-full"
        >
          {registrationErrorMessage}
        </div>
      )}
      <div className="w-full flex flex-col gap-5">
        <FormInput
          id="email"
          type="email"
          placeholder="Enter your email address"
          label="Email"
          required
        />

        <FormInput
          id="password"
          type="password"
          placeholder="Enter your password"
          label="Password"
          required
        />

        <div className="relative">
          <label className="mb-3 mt-5" htmlFor="role">
            Role
          </label>

          <select
            className="peer block w-full rounded-md border border-gray-200 py-[9px] text-sm outline-2"
            id="role"
            name="role"
            required
          >
            {Object.values(UserRole)
              .filter((role) => role !== UserRole.ADMIN)
              .map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
          </select>
        </div>

        <div
          className="flex justify-center h-8 items-end space-x-1"
          aria-live="polite"
          aria-atomic="true"
        >
          <Button
            type="submit"
            aria-disabled={isRegistrationPending}
            disabled={isRegistrationPending}
          >
            Register
          </Button>
        </div>
      </div>
    </form>
  );
}
