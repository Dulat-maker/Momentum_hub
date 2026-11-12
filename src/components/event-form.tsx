"use client";

import { useActionState } from "react";

import { type ActionState, emptyActionState } from "@/lib/action-state";
import { isoToLocalInput } from "@/lib/datetime";
import {
  EVENT_FORMATS,
  EVENT_KINDS,
  FORMAT_LABELS,
  type EventRow,
  KIND_LABELS,
} from "@/lib/types";

import { ErrorAlert } from "./alert";
import { SubmitButton } from "./submit-button";

export function EventForm({
  action,
  event,
  submitLabel,
  defaultCity = "",
  defaultCountry = "Kazakhstan",
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  event?: EventRow;
  submitLabel: string;
  defaultCity?: string;
  defaultCountry?: string;
}) {
  const [state, formAction] = useActionState(action, emptyActionState);

  return (
    <form action={formAction} className="space-y-8">
      {event ? <input type="hidden" name="event_id" value={event.id} /> : null}

      <ErrorAlert message={state.error} />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wider text-fg-dim uppercase">
          The basics
        </h2>

        <div>
          <label className="field-label" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            defaultValue={event?.title}
            className="input"
            placeholder="Almaty pre-season scrimmage"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="summary">
            One-line summary
          </label>
          <input
            id="summary"
            name="summary"
            defaultValue={event?.summary ?? ""}
            className="input"
            placeholder="Four fields, open practice matches, bring your robot"
          />
          <p className="mt-1.5 text-xs text-fg-dim">
            Shown on the event card. Keep it short.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="kind">
              Kind of event
            </label>
            <select
              id="kind"
              name="kind"
              defaultValue={event?.kind ?? "workshop"}
              className="input"
            >
              {EVENT_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {KIND_LABELS[kind]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="format">
              How it runs
            </label>
            <select
              id="format"
              name="format"
              defaultValue={event?.format ?? "in_person"}
              className="input"
            >
              {EVENT_FORMATS.map((format) => (
                <option key={format} value={format}>
                  {FORMAT_LABELS[format]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <hr className="border-line" />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wider text-fg-dim uppercase">
          When
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="starts_at">
              Starts
            </label>
            <input
              id="starts_at"
              name="starts_at"
              type="datetime-local"
              required
              defaultValue={isoToLocalInput(event?.starts_at ?? null)}
              className="input"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="ends_at">
              Ends (optional)
            </label>
            <input
              id="ends_at"
              name="ends_at"
              type="datetime-local"
              defaultValue={isoToLocalInput(event?.ends_at ?? null)}
              className="input"
            />
          </div>
        </div>
        <p className="text-xs text-fg-dim">
          Times are read as Almaty time (UTC+5).
        </p>
      </section>

      <hr className="border-line" />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wider text-fg-dim uppercase">
          Where
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="city">
              City
            </label>
            <input
              id="city"
              name="city"
              defaultValue={event?.city ?? defaultCity}
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
              defaultValue={event?.country ?? defaultCountry}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="venue">
            Venue or meeting link
          </label>
          <input
            id="venue"
            name="venue"
            defaultValue={event?.venue ?? ""}
            className="input"
            placeholder="NIS Almaty, sports hall / Zoom link"
          />
        </div>
      </section>

      <hr className="border-line" />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wider text-fg-dim uppercase">
          Taking part
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="capacity">
              Spots for teams (optional)
            </label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              defaultValue={event?.capacity ?? ""}
              className="input"
              placeholder="12"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="cost">
              Cost (optional)
            </label>
            <input
              id="cost"
              name="cost"
              defaultValue={event?.cost ?? ""}
              className="input"
              placeholder="Free / 5000 KZT per team"
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="registration_url">
            Registration link (optional)
          </label>
          <input
            id="registration_url"
            name="registration_url"
            defaultValue={event?.registration_url ?? ""}
            className="input"
            placeholder="https://forms.gle/..."
          />
        </div>

        <div>
          <label className="field-label" htmlFor="description">
            Full description
          </label>
          <textarea
            id="description"
            name="description"
            rows={8}
            defaultValue={event?.description ?? ""}
            className="input resize-y"
            placeholder={
              "What happens, what to bring, the schedule, who to contact..."
            }
          />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <SubmitButton pendingLabel="Publishing...">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
