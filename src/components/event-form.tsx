"use client";

import { useActionState } from "react";

import { type ActionState, emptyActionState } from "@/lib/action-state";
import { isoToLocalInput } from "@/lib/datetime";
import {
  AUDIENCE_LABELS,
  EVENT_AUDIENCES,
  EVENT_FORMATS,
  EVENT_KINDS,
  FORMAT_LABELS,
  type EventAudience,
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
  defaultAudience = "all",
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  event?: EventRow;
  submitLabel: string;
  defaultCity?: string;
  defaultCountry?: string;
  defaultAudience?: EventAudience;
}) {
  const [state, formAction] = useActionState(action, emptyActionState);

  // React clears an uncontrolled form once its action finishes, so a rejected
  // submission comes back empty unless the form is handed its own values
  // again. `stamp` changes on every rejection, which remounts the fields so
  // the new defaults take.
  const value = (name: string, fallback?: string | number | null) =>
    state.values?.[name] ?? (fallback == null ? "" : String(fallback));

  const invalid = (name: string) => state.field === name;

  return (
    <form
      key={state.stamp ?? "new"}
      action={formAction}
      className="space-y-8"
    >
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
            defaultValue={value("title", event?.title)}
            aria-invalid={invalid("title") || undefined}
            autoFocus={invalid("title")}
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
            defaultValue={value("summary", event?.summary)}
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
              defaultValue={value("kind", event?.kind ?? "workshop")}
            aria-invalid={invalid("kind") || undefined}
            autoFocus={invalid("kind")}
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
              defaultValue={value("format", event?.format ?? "in_person")}
            aria-invalid={invalid("format") || undefined}
            autoFocus={invalid("format")}
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

        <div>
          <label className="field-label" htmlFor="audience">
            Who it is for
          </label>
          <select
            id="audience"
            name="audience"
            defaultValue={value("audience", event?.audience ?? defaultAudience)}
            aria-invalid={invalid("audience") || undefined}
            autoFocus={invalid("audience")}
            className="input"
          >
            {EVENT_AUDIENCES.map((audience) => (
              <option key={audience} value={audience}>
                {AUDIENCE_LABELS[audience]}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-fg-dim">
            Teams filter the calendar by this, so an FLL workshop does not show
            up as something an FTC team should turn up to.
          </p>
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
              defaultValue={value("starts_at", isoToLocalInput(event?.starts_at ?? null))}
            aria-invalid={invalid("starts_at") || undefined}
            autoFocus={invalid("starts_at")}
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
              defaultValue={value("ends_at", isoToLocalInput(event?.ends_at ?? null))}
            aria-invalid={invalid("ends_at") || undefined}
            autoFocus={invalid("ends_at")}
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
              defaultValue={value("city", event?.city ?? defaultCity)}
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
              defaultValue={value("country", event?.country ?? defaultCountry)}
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
            defaultValue={value("venue", event?.venue)}
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
              defaultValue={value("capacity", event?.capacity)}
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
              defaultValue={value("cost", event?.cost)}
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
            defaultValue={value("registration_url", event?.registration_url)}
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
            defaultValue={value("description", event?.description)}
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
