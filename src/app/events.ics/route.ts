import { buildCalendarIcs } from "@/lib/ics";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  PROGRAM_LABELS,
  type Program,
  isEventAudience,
} from "@/lib/types";

type Row = {
  id: string;
  title: string;
  summary: string | null;
  description: string | null;
  city: string | null;
  country: string | null;
  venue: string | null;
  format: string;
  starts_at: string;
  ends_at: string | null;
  team: { program: Program; team_number: number; name: string } | null;
};

/**
 * The whole calendar as one feed, so a team subscribes once instead of saving
 * every event by hand. `?for=ftc` narrows it to one programme, keeping events
 * that are open to both.
 */
export async function GET(request: Request) {
  if (!isSupabaseConfigured) {
    return new Response("Calendar feed needs the database.", { status: 503 });
  }

  const audience = new URL(request.url).searchParams.get("for");
  const supabase = await createClient();

  // A little history, so a freshly subscribed calendar is not empty between
  // seasons, but not the whole archive.
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from("events")
    .select(
      "id, title, summary, description, city, country, venue, format, starts_at, ends_at, team:teams!events_team_id_fkey(program, team_number, name)",
    )
    .gte("starts_at", from)
    .order("starts_at", { ascending: true })
    .limit(500);

  if (isEventAudience(audience) && audience !== "all") {
    query = query.in("audience", [audience, "all"]);
  }

  const { data, error } = await query;

  if (error) {
    return new Response(`Could not build the feed: ${error.message}`, {
      status: 500,
    });
  }

  const rows = (data ?? []) as unknown as Row[];

  const name =
    isEventAudience(audience) && audience !== "all"
      ? `Momentum Hub - ${PROGRAM_LABELS[audience]}`
      : "Momentum Hub";

  const body = buildCalendarIcs(
    rows.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description ?? event.summary,
      location:
        event.format === "online"
          ? (event.venue ?? "Online")
          : [event.venue, event.city, event.country].filter(Boolean).join(", "),
      url: new URL(`/events/${event.id}`, request.url).toString(),
      startsAt: event.starts_at,
      endsAt: event.ends_at,
      organiser: event.team
        ? `${PROGRAM_LABELS[event.team.program]} #${event.team.team_number} ${event.team.name}`
        : null,
    })),
    name,
  );

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      // Inline, not an attachment: calendar apps fetch this URL repeatedly.
      "Content-Disposition": 'inline; filename="momentum-hub.ics"',
      "Cache-Control": "public, max-age=900",
    },
  });
}
