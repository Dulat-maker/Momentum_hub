import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { EventCard } from "@/components/event-card";
import { EventFilters } from "@/components/event-filters";
import { CalendarIcon, PlusIcon } from "@/components/icons";
import { SetupNotice } from "@/components/setup-notice";
import { getCurrentTeam } from "@/lib/auth";
import {
  EVENT_CARD_SELECT,
  describeQueryError,
  eventCities,
  likedEventIds,
  sanitizeSearch,
} from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { type EventWithTeam, isProgram } from "@/lib/types";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Every FTC and FLL scrimmage, workshop, outreach day and meetup posted by teams on the hub.",
};

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isSupabaseConfigured) {
    return (
      <div className="px-4 py-16 sm:px-6">
        <SetupNotice />
      </div>
    );
  }

  const params = await searchParams;
  const filters = {
    q: first(params.q),
    city: first(params.city),
    format: first(params.format),
    kind: first(params.kind),
    when: first(params.when) || "upcoming",
    program: first(params.program),
  };

  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  let query = supabase.from("events").select(EVENT_CARD_SELECT);

  if (filters.when === "past") {
    query = query.lt("starts_at", nowIso).order("starts_at", { ascending: false });
  } else if (filters.when === "all") {
    query = query.order("starts_at", { ascending: false });
  } else {
    query = query.gte("starts_at", nowIso).order("starts_at", { ascending: true });
  }

  if (filters.city) query = query.eq("city", filters.city);
  if (filters.format) query = query.eq("format", filters.format);
  if (filters.kind) query = query.eq("kind", filters.kind);

  // Filtering by programme keeps the events open to everyone, too.
  if (isProgram(filters.program)) {
    query = query.in("audience", [filters.program, "all"]);
  }

  const search = sanitizeSearch(filters.q);
  if (search) {
    query = query.or(
      `title.ilike.%${search}%,summary.ilike.%${search}%,venue.ilike.%${search}%,city.ilike.%${search}%`,
    );
  }

  const [{ data, error }, cities, team] = await Promise.all([
    query.limit(100),
    eventCities(),
    getCurrentTeam(),
  ]);

  const liked = await likedEventIds(team?.id);
  const events = (data ?? []) as unknown as EventWithTeam[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">What is on</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Events</h1>
          <p className="mt-2 max-w-xl text-fg-muted">
            Scrimmages, workshops, outreach days and meetups - all posted by
            teams themselves.
          </p>
          <p className="mt-3 max-w-xl text-sm text-fg-dim">
            Rather not check back?{" "}
            <a
              href="/events.ics"
              className="text-brand-mid underline decoration-brand-mid/40 underline-offset-4 hover:decoration-brand-mid"
            >
              Subscribe to the calendar feed
            </a>{" "}
            - add the link under &quot;Other calendars → From URL&quot; and new
            events arrive on their own.
          </p>
        </div>

        <Link href={team ? "/events/new" : "/login?next=/events/new"} className="btn btn-primary">
          <PlusIcon className="size-4" />
          Add an event
        </Link>
      </div>

      <div className="mt-8">
        <EventFilters cities={cities} current={filters} />
      </div>

      {error ? (
        <p className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Could not load events: {describeQueryError(error)}
        </p>
      ) : null}

      <p className="mt-8 mb-4 text-sm text-fg-dim">
        {events.length === 0
          ? "No events match"
          : `${events.length} event${events.length === 1 ? "" : "s"}`}
      </p>

      {events.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="size-6" />}
          title={
            filters.when === "upcoming"
              ? "Nothing scheduled yet"
              : "No events match these filters"
          }
          body={
            filters.when === "upcoming"
              ? "Be the first team to put something on the calendar - a scrimmage, a workshop, even a casual build day."
              : "Try widening the filters, or look at all dates."
          }
          actionLabel={team ? "Add an event" : "Register your team"}
          actionHref={team ? "/events/new" : "/signup"}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              liked={liked.has(event.id)}
              canLike={Boolean(team)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
