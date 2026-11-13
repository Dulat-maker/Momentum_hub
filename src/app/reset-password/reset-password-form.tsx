"use client";

import { useActionState } from "react";

import { ErrorAlert } from "@/components/alert";
import { SubmitButton } from "@/components/submit-button";
import { emptyActionState } from "@/lib/action-state";
import { updatePasswordAction } from "@/lib/actions/auth";

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(
    updatePasswordAction,
    emptyActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <ErrorAlert message={state.error} />

      <div>
        <label className="field-label" htmlFor="password">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="input"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="password_repeat">
          Repeat it
        </label>
        <input
          id="password_repeat"
          name="password_repeat"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="input"
        />
      </div>

      <SubmitButton className="btn btn-primary w-full" pendingLabel="Saving...">
        Set the new password
      </SubmitButton>
    </form>
  );
}
