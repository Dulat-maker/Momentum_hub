import type { Metadata } from "next";
import Link from "next/link";

import { EventForm } from "@/components/event-form";
import { requireTeam } from "@/lib/auth";
import { createEventAction } from "@/lib/actions/events";

export const metadata: Metadata = { title: "Add an event" };

export default async function NewEventPage() {
  const team = await requireTeam("/events/new");

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
          It shows up on the hub right away, under your team&apos;s name.
        </p>
      </div>

      <div className="card mt-8 p-6 sm:p-8">
        <EventForm
          action={createEventAction}
          submitLabel="Publish event"
          defaultCity={team.city ?? ""}
          defaultCountry={team.country ?? "Kazakhstan"}
        />
      </div>
    </div>
  );
}
