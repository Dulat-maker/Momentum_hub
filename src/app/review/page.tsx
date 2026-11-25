import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { CalendarIcon } from "@/components/icons";
import { ReviewCard } from "@/components/review-card";
import { SetupNotice } from "@/components/setup-notice";
import { requireProfile } from "@/lib/auth";
import { EVENT_CARD_SELECT } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { EventWithTeam } from "@/lib/types";

export const metadata: Metadata = { title: "Waiting for review" };

export default async function ReviewPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="px-4 py-16 sm:px-6">
        <SetupNotice />
      </div>
    );
  }

  const profile = await requireProfile("/review");

  // Not a 404: somebody who followed the link should be told what this is
  // and that it is not theirs, rather than shown a wall.
  if (!profile.is_moderator) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16 sm:px-6">
        <div className="card p-6 text-center sm:p-8">
          <h1 className="text-2xl font-semibold">Not your desk</h1>
          <p className="mt-3 text-fg-muted">
            This is where submitted events are let onto the calendar, and that
            is Momentum&apos;s job. If your team has an event, your captain can
            put it forward.
          </p>
          <Link href="/events" className="btn btn-outline mt-6">
            Browse events
          </Link>
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  const { data } = await supabase
    .from("events")
    .select(EVENT_CARD_SELECT)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const pending = (data ?? []) as unknown as EventWithTeam[];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="eyebrow">Moderation</p>
      <h1 className="section-title mt-2">Waiting for review</h1>
      <p className="mt-3 max-w-xl text-fg-muted">
        Captains put their events forward and they land here. Nothing appears
        on the calendar, in search or in the feed until you let it through.
      </p>

      <p className="mt-8 mb-4 text-sm text-fg-dim">
        {pending.length === 0
          ? "Nothing waiting"
          : `${pending.length} waiting`}
      </p>

      {pending.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="size-6" />}
          title="Nothing to look at"
          body="When a captain submits an event it turns up here. Until then there is nothing for you to do."
          actionLabel="Browse events"
          actionHref="/events"
        />
      ) : (
        <div className="space-y-5">
          {pending.map((event) => (
            <ReviewCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
