"use client";

import Link from "next/link";
import { useActionState } from "react";

import { emptyActionState } from "@/lib/action-state";
import { reviewEventAction } from "@/lib/actions/events";
import { formatEventWhen, timeAgo } from "@/lib/format";
import {
  AUDIENCE_LABELS,
  type EventWithTeam,
  PROGRAM_LABELS,
  teamHref,
} from "@/lib/types";

import { ErrorAlert, SuccessAlert } from "./alert";

/**
 * One event waiting to be let onto the calendar.
 *
 * Approve and turn down are the same form: the note belongs to whichever was
 * pressed, and a reason matters most on the one that says no.
 */
export function ReviewCard({ event }: { event: EventWithTeam }) {
  const [state, formAction, pending] = useActionState(
    reviewEventAction,
    emptyActionState,
  );

  const team = event.team;

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{event.title}</h2>
          <p className="mt-1 text-sm text-fg-muted">
            {formatEventWhen(event.starts_at, event.ends_at)}
          </p>
        </div>
        <span className="chip shrink-0">{timeAgo(event.created_at)}</span>
      </div>

      {event.summary ? (
        <p className="mt-3 text-sm text-fg-muted">{event.summary}</p>
      ) : null}

      <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="text-fg-dim">Where</dt>
          <dd className="min-w-0 truncate">
            {[event.venue, event.city, event.country]
              .filter(Boolean)
              .join(", ") || "Not said"}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-fg-dim">For</dt>
          <dd>{AUDIENCE_LABELS[event.audience]}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-fg-dim">Spots</dt>
          <dd>{event.capacity ?? "No limit"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-fg-dim">Cost</dt>
          <dd className="min-w-0 truncate">{event.cost || "Free"}</dd>
        </div>
      </dl>

      {team ? (
        <p className="mt-4 text-sm">
          <span className="text-fg-dim">Submitted by </span>
          <Link
            href={teamHref(team)}
            className="text-brand-mid underline decoration-brand-mid/40 underline-offset-4"
          >
            {PROGRAM_LABELS[team.program]} #{team.team_number} {team.name}
          </Link>
        </p>
      ) : null}

      <p className="mt-3 text-sm">
        <Link
          href={`/events/${event.id}`}
          className="text-fg-muted underline decoration-line underline-offset-4 hover:text-fg"
        >
          Read the whole thing
        </Link>
      </p>

      <form action={formAction} className="mt-5 space-y-3 border-t border-line pt-5">
        <input type="hidden" name="event_id" value={event.id} />

        <ErrorAlert message={state.error} />
        <SuccessAlert message={state.success} />

        <div>
          <label className="field-label" htmlFor={`note-${event.id}`}>
            A word back (optional)
          </label>
          <input
            id={`note-${event.id}`}
            name="review_note"
            className="input"
            placeholder="Clash with the regional - move it a week?"
          />
          <p className="mt-1.5 text-xs text-fg-dim">
            The team sees this on their dashboard. Worth writing if you are
            turning it down.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            name="decision"
            value="approved"
            disabled={pending}
            className="btn btn-primary"
          >
            {pending ? "Saving..." : "Put it on the calendar"}
          </button>
          <button
            type="submit"
            name="decision"
            value="rejected"
            disabled={pending}
            className="btn btn-ghost"
          >
            Turn it down
          </button>
        </div>
      </form>
    </div>
  );
}
