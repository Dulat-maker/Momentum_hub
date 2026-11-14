"use client";

import { useActionState } from "react";

import { ErrorAlert } from "@/components/alert";
import { SubmitButton } from "@/components/submit-button";
import { emptyActionState } from "@/lib/action-state";
import { signUpAction } from "@/lib/actions/auth";

export function SignupForm() {
  const [state, formAction] = useActionState(signUpAction, emptyActionState);

  // Everything typed comes back after a rejection, except the passwords -
  // those are never sent down to the page.
  const value = (name: string, fallback = "") =>
    state.values?.[name] ?? fallback;
  const invalid = (name: string) => state.field === name;

  return (
    <form key={state.stamp ?? "new"} action={formAction} className="space-y-5">
      <ErrorAlert message={state.error} />

      <div>
        <label className="field-label" htmlFor="full_name">
          Your name
        </label>
        <input
          id="full_name"
          name="full_name"
          autoComplete="name"
          required
          defaultValue={value("full_name")}
          aria-invalid={invalid("full_name") || undefined}
          autoFocus={invalid("full_name")}
          className="input"
          placeholder="Aidana Serikova"
        />
        <p className="mt-1.5 text-xs text-fg-dim">
          How your team sees you on the roster.
        </p>
      </div>

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
          defaultValue={value("email")}
          aria-invalid={invalid("email") || undefined}
          autoFocus={invalid("email")}
          className="input"
          placeholder="you@example.com"
        />
        <p className="mt-1.5 text-xs text-fg-dim">
          Your own address - it is your login, and invitations come to it.
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
            aria-invalid={invalid("password") || undefined}
            autoFocus={invalid("password")}
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
            aria-invalid={invalid("password_repeat") || undefined}
            autoFocus={invalid("password_repeat")}
            className="input"
          />
        </div>
      </div>

      <SubmitButton
        className="btn btn-primary w-full"
        pendingLabel="Creating the account..."
      >
        Create my account
      </SubmitButton>
    </form>
  );
}
