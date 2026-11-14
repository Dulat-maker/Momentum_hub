"use client";

import { useActionState } from "react";

import { ErrorAlert } from "@/components/alert";
import { SubmitButton } from "@/components/submit-button";
import { emptyActionState } from "@/lib/action-state";
import { createTeamAction } from "@/lib/actions/teams";
import { PROGRAM_FULL_NAMES, PROGRAM_LABELS, PROGRAMS } from "@/lib/types";

export function CreateTeamForm() {
  const [state, formAction] = useActionState(
    createTeamAction,
    emptyActionState,
  );

  const value = (name: string, fallback = "") =>
    state.values?.[name] ?? fallback;
  const invalid = (name: string) => state.field === name;

  return (
    <form key={state.stamp ?? "new"} action={formAction} className="space-y-5">
      <ErrorAlert message={state.error} />

      <fieldset>
        <legend className="field-label">Which programme?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {PROGRAMS.map((program) => (
            <label key={program} className="cursor-pointer">
              <input
                type="radio"
                name="program"
                value={program}
                defaultChecked={value("program", "ftc") === program}
                className="peer sr-only"
              />
              <span className="block rounded-xl border border-line bg-canvas px-4 py-3 transition-colors peer-checked:border-brand-mid peer-checked:bg-brand/15 peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40">
                <span className="font-display block text-sm font-semibold">
                  {PROGRAM_LABELS[program]}
                </span>
                <span className="mt-0.5 block text-xs text-fg-dim">
                  {PROGRAM_FULL_NAMES[program]}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

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
            defaultValue={value("team_number")}
            aria-invalid={invalid("team_number") || undefined}
            autoFocus={invalid("team_number")}
            className="input"
            placeholder="12345"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="name">
            Team name
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={value("name")}
            aria-invalid={invalid("name") || undefined}
            autoFocus={invalid("name")}
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
            defaultValue={value("city")}
            aria-invalid={invalid("city") || undefined}
            autoFocus={invalid("city")}
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
            defaultValue={value("country", "Kazakhstan")}
          />
        </div>
      </div>

      <SubmitButton
        className="btn btn-primary w-full"
        pendingLabel="Registering..."
      >
        Register the team
      </SubmitButton>
    </form>
  );
}
