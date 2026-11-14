"use client";

import { useActionState } from "react";

import { ErrorAlert } from "@/components/alert";
import { SubmitButton } from "@/components/submit-button";
import { emptyActionState } from "@/lib/action-state";
import { signInAction } from "@/lib/actions/auth";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(signInAction, emptyActionState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <ErrorAlert message={state.error} />

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

      <div>
        <label className="field-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
          placeholder="........"
        />
      </div>

      <SubmitButton className="btn btn-primary w-full" pendingLabel="Logging in...">
        Log in
      </SubmitButton>
    </form>
  );
}
