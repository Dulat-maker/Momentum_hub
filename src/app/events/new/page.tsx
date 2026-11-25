import type { Metadata } from "next";
import Link from "next/link";

import { EventForm } from "@/components/event-form";
import { requireMembership } from "@/lib/auth";
import { createEventAction } from "@/lib/actions/events";
import { canSubmitEvents } from "@/lib/types";

export const metadata: Metadata = { title: "Add an event" };

export default async function NewEventPage() {
  const membership = await requireMembership("/events/new");
  const team = membership.team;

  if (!canSubmitEvents(membership.role)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div className="card p-6 text-center sm:p-8">
          <h1 className="text-2xl font-semibold">Captains put events up</h1>
          <p className="mt-3 text-fg-muted">
            Ask your captain to add it - an event goes up under the
            team&apos;s name, so it is theirs to submit.
          </p>
          <Link href="/events" className="btn btn-outline mt-6">
            Browse events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/events"
        className="text-sm text-fg-muted transition-colors hover:text-fg"
      >
        &larr; Back to events
      </Link>

      <div className="mt-5">
        <p className="eyebrow">Hosted by #{team.team_number}</p>
        <h1 className="mt-2 text-3xl font-semibold">Add an event</h1>
        <p className="mt-2 text-fg-muted">
          It goes to Momentum first. Once they let it through it is on the
          calendar under your team&apos;s name - your dashboard shows where
          it stands meanwhile.
        </p>
      </div>

      <div className="card mt-8 p-6 sm:p-8">
        <EventForm
          action={createEventAction}
          teamId={team.id}
          submitLabel="Send for review"
          defaultCity={team.city ?? ""}
          defaultCountry={team.country ?? "Kazakhstan"}
          defaultAudience={team.program}
        />
      </div>
    </div>
  );
}
