"use client";

import { useActionState } from "react";

import { ErrorAlert, SuccessAlert } from "@/components/alert";
import { SubmitButton } from "@/components/submit-button";
import { emptyActionState } from "@/lib/action-state";
import { requestPasswordResetAction } from "@/lib/actions/auth";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(
    requestPasswordResetAction,
    emptyActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <ErrorAlert message={state.error} />
      <SuccessAlert message={state.success} />

      <div>
        <label className="field-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="input"
          placeholder="team12345@example.com"
        />
      </div>

      <SubmitButton className="btn btn-primary w-full" pendingLabel="Sending...">
        Send the reset link
      </SubmitButton>
    </form>
  );
}
