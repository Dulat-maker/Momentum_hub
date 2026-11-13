import { createClient } from "./supabase/server";

export const EVENT_CARD_SELECT = [
  "id",
  "team_id",
  "title",
  "summary",
  "description",
  "city",
  "country",
  "venue",
  "format",
  "kind",
  "audience",
  "starts_at",
  "ends_at",
  "registration_url",
  "capacity",
  "cost",
  "created_at",
  "team:teams!events_team_id_fkey(id, program, team_number, name, city, logo_url)",
  "likes:event_likes(count)",
  "feedback:event_feedback(count)",
  "attendance:event_attendance(count)",
].join(", ");

export const POST_CARD_SELECT = [
  "id",
  "team_id",
  "title",
  "body",
  "category",
  "created_at",
  "team:teams!posts_team_id_fkey(id, program, team_number, name, city, logo_url)",
  "likes:post_likes(count)",
  "comments:post_comments(count)",
].join(", ");

export const TEAM_SUMMARY_SELECT =
  "id, program, team_number, name, city, logo_url";

/** Which events this team has already liked - used to fill in the heart icons. */
export async function likedEventIds(
  teamId: string | null | undefined,
): Promise<Set<string>> {
  if (!teamId) return new Set();

  const supabase = await createClient();
  const { data } = await supabase
    .from("event_likes")
    .select("event_id")
    .eq("team_id", teamId);

  return new Set((data ?? []).map((row) => row.event_id as string));
}

export async function likedPostIds(
  teamId: string | null | undefined,
): Promise<Set<string>> {
  if (!teamId) return new Set();

  const supabase = await createClient();
  const { data } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("team_id", teamId);

  return new Set((data ?? []).map((row) => row.post_id as string));
}

/** Distinct, sorted city names that actually have events. */
export async function eventCities(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("city")
    .not("city", "eq", "");

  const cities = new Set(
    (data ?? [])
      .map((row) => (row.city as string | null)?.trim())
      .filter((city): city is string => Boolean(city)),
  );

  return [...cities].sort((a, b) => a.localeCompare(b));
}

/**
 * Turns a Supabase error into something a person can act on. The common one
 * is a schema that has not caught up with the code, which otherwise surfaces
 * as "column teams.program does not exist".
 */
export function describeQueryError(
  error: { code?: string; message: string } | null,
): string | null {
  if (!error) return null;

  // A missing column answers 42703, a missing table 42P01, and an embed of a
  // table that is not there yet answers PGRST200 with wording of its own.
  const behind =
    error.code === "42703" ||
    error.code === "42P01" ||
    error.code === "PGRST200" ||
    /column .+ does not exist|could not find (a relationship|the table)/i.test(
      error.message,
    );

  if (behind) {
    return "The database is a step behind the site. Run the newest file in supabase/migrations/ in the Supabase SQL editor, then reload this page.";
  }

  return error.message;
}

/** PostgREST `or` filters are comma separated, so strip the syntax characters. */
export function sanitizeSearch(value: string): string {
  return value.replace(/[,()%*\\]/g, " ").trim().slice(0, 80);
}

export async function hubStats(): Promise<{
  teams: number;
  events: number;
  cities: number;
  posts: number;
}> {
  const supabase = await createClient();

  const [teams, events, posts, cityRows] = await Promise.all([
    supabase.from("teams").select("id", { count: "exact", head: true }),
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase.from("posts").select("id", { count: "exact", head: true }),
    supabase.from("teams").select("city"),
  ]);

  const cities = new Set(
    (cityRows.data ?? [])
      .map((row) => (row.city as string | null)?.trim().toLowerCase())
      .filter((city): city is string => Boolean(city)),
  );

  return {
    teams: teams.count ?? 0,
    events: events.count ?? 0,
    posts: posts.count ?? 0,
    cities: cities.size,
  };
}
