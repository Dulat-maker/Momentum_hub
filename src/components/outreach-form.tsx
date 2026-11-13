"use client";

import { useActionState } from "react";

import { emptyActionState } from "@/lib/action-state";
import { addOutreachAction } from "@/lib/actions/outreach";

import { ErrorAlert, SuccessAlert } from "./alert";
import { PlusIcon } from "./icons";
import { SubmitButton } from "./submit-button";

export function OutreachForm({ today }: { today: string }) {
  const [state, formAction] = useActionState(
    addOutreachAction,
    emptyActionState,
  );

  const value = (name: string, fallback = "") =>
    state.values?.[name] ?? fallback;
  const invalid = (name: string) => state.field === name;

  return (
    <form
      key={state.stamp ?? "new"}
      action={formAction}
      className="space-y-4"
    >
      <ErrorAlert message={state.error} />
      <SuccessAlert message={state.success} />

      <div className="grid gap-4 sm:grid-cols-[1fr_170px]">
        <div>
          <label className="field-label" htmlFor="outreach-title">
            What the team did
          </label>
          <input
            id="outreach-title"
            name="title"
            required
            defaultValue={value("title")}
            aria-invalid={invalid("title") || undefined}
            autoFocus={invalid("title")}
            className="input"
            placeholder="Robotics workshop at school 28"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="outreach-date">
            When
          </label>
          <input
            id="outreach-date"
            name="happened_on"
            type="date"
            required
            defaultValue={value("happened_on", today)}
            aria-invalid={invalid("happened_on") || undefined}
            className="input"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="field-label" htmlFor="outreach-people">
            People reached
          </label>
          <input
            id="outreach-people"
            name="people_reached"
            type="number"
            min={0}
            defaultValue={value("people_reached")}
            aria-invalid={invalid("people_reached") || undefined}
            className="input"
            placeholder="45"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="outreach-hours">
            Team hours
          </label>
          <input
            id="outreach-hours"
            name="hours"
            type="number"
            min={0}
            step="0.5"
            defaultValue={value("hours")}
            aria-invalid={invalid("hours") || undefined}
            className="input"
            placeholder="6"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="outreach-link">
            Link
          </label>
          <input
            id="outreach-link"
            name="link"
            defaultValue={value("link")}
            className="input"
            placeholder="Post, album, article"
          />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="outreach-description">
          Details
        </label>
        <textarea
          id="outreach-description"
          name="description"
          rows={3}
          defaultValue={value("description")}
          className="input resize-y"
          placeholder="Who it was for, what you showed them, what came of it."
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-fg-dim">
          Numbers are optional. Leave one out rather than guessing at it.
        </p>
        <SubmitButton className="btn btn-outline" pendingLabel="Adding...">
          <PlusIcon className="size-4" />
          Add to the log
        </SubmitButton>
      </div>
    </form>
  );
}
