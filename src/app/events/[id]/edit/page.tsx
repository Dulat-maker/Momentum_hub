import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EventForm } from "@/components/event-form";
import { TrashIcon } from "@/components/icons";
import { IconSubmitButton } from "@/components/submit-button";
import { deleteEventAction, updateEventAction } from "@/lib/actions/events";
import { requireTeam } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { EventRow } from "@/lib/types";

export const metadata: Metadata = { title: "Edit event" };

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const team = await requireTeam(`/events/${id}/edit`);

  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const event = data as EventRow | null;

  if (!event || event.team_id !== team.id) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href={`/events/${event.id}`}
        className="text-sm text-fg-muted transition-colors hover:text-fg"
      >
        &larr; Back to the event
      </Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your event</p>
          <h1 className="mt-2 text-3xl font-semibold">Edit event</h1>
        </div>

        <form action={deleteEventAction}>
          <input type="hidden" name="event_id" value={event.id} />
          <IconSubmitButton
            className="btn btn-danger btn-sm"
            title="Delete this event"
          >
            <TrashIcon className="size-4" />
            Delete
          </IconSubmitButton>
        </form>
      </div>

      <div className="card mt-8 p-6 sm:p-8">
        <EventForm
          action={updateEventAction}
          event={event}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
