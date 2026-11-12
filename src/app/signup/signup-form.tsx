"use client";

import { useActionState } from "react";

import { ErrorAlert } from "@/components/alert";
import { SubmitButton } from "@/components/submit-button";
import { emptyActionState } from "@/lib/action-state";
import { signUpAction } from "@/lib/actions/auth";

export function SignupForm() {
  const [state, formAction] = useActionState(signUpAction, emptyActionState);

  return (
    <form action={formAction} className="space-y-5">
      <ErrorAlert message={state.error} />

      <div className="grid gap-4 sm:grid-cols-[130px_1fr]">
        <div>
          <label className="field-label" htmlFor="team_number">
            Team #
          </label>
          <input
            id="team_number"
            name="team_number"
            type="number"
            min={1}
            required
            className="input"
            placeholder="12345"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="team_name">
            Team name
          </label>
          <input
            id="team_name"
            name="team_name"
            required
            className="input"
            placeholder="Momentum"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="city">
            City
          </label>
          <input
            id="city"
            name="city"
            required
            className="input"
            placeholder="Almaty"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="country">
            Country
          </label>
          <input
            id="country"
            name="country"
            className="input"
            defaultValue="Kazakhstan"
          />
        </div>
      </div>

      <hr className="border-line" />

      <div>
        <label className="field-label" htmlFor="email">
          Team email
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
        <p className="mt-1.5 text-xs text-fg-dim">
          Use an address the whole team can reach - it is the login for the
          account.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="password">
            Password
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
            Repeat password
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
      </div>

      <SubmitButton
        className="btn btn-primary w-full"
        pendingLabel="Creating the account..."
      >
        Register team
      </SubmitButton>
    </form>
  );
}
