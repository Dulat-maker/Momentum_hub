import { buildEventIcs, icsFileName } from "@/lib/ics";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { PROGRAM_LABELS, type Program } from "@/lib/types";

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
  team: {
    program: Program;
    team_number: number;
    name: string;
  } | null;
};

/** Serves one event as a calendar file, for "add to calendar" links. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured) {
    return new Response("Calendar export needs the database.", { status: 503 });
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("events")
    .select(
      "id, title, summary, description, city, country, venue, format, starts_at, ends_at, team:teams!events_team_id_fkey(program, team_number, name)",
    )
    .eq("id", id)
    .maybeSingle();

  const event = data as unknown as Row | null;
  if (!event) return new Response("Event not found.", { status: 404 });

  const location =
    event.format === "online"
      ? (event.venue ?? "Online")
      : [event.venue, event.city, event.country].filter(Boolean).join(", ");

  const organiser = event.team
    ? `${PROGRAM_LABELS[event.team.program]} #${event.team.team_number} ${event.team.name}`
    : null;

  const body = buildEventIcs({
    id: event.id,
    title: event.title,
    description: event.description ?? event.summary,
    location,
    url: new URL(`/events/${event.id}`, request.url).toString(),
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    organiser,
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${icsFileName(event.title)}"`,
      // The time can be edited by the host, so do not let caches hold it.
      "Cache-Control": "no-store",
    },
  });
}
