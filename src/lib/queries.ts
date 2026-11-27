import { cache } from "react";

import { createClient } from "./supabase/server";
import type { TeamMember, TeamRole } from "./types";

const EVENT_CARD_FIELDS = [
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
  "cover_url",
  "capacity",
  "cost",
  "created_at",
  "team:teams!events_team_id_fkey(id, program, team_number, name, city, logo_url)",
  "likes:event_likes(count)",
  "feedback:event_feedback(count)",
  "attendance:event_attendance(count)",
];

/**
 * What to ask for, given what the database has.
 *
 * A column the migration has not added yet is not a missing feature, it
 * is a syntax error as far as PostgREST is concerned, and it takes the
 * whole query down with it. So the query is built to match.
 */
export function eventCardSelect(withReview: boolean): string {
  return (
    withReview ? [...EVENT_CARD_FIELDS, "status"] : EVENT_CARD_FIELDS
  ).join(", ");
}

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

/**
 * How many submitted events are waiting to be let through.
 *
 * Only worth asking as a moderator: the select policy shows everyone else
 * nothing but their own team's, so the number would mean something different
 * to each person reading it.
 */
export async function pendingEventCount(): Promise<number> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return count ?? 0;
}

/* ------------------------------------------------------------------ *
 * What this database can do yet.
 *
 * A migration lands when somebody runs it, which is not the moment the
 * code that needs it is deployed. In between, a page that assumes the new
 * shape does not degrade - it fails outright and takes the calendar with
 * it. So the shape is asked about rather than assumed.
 *
 * Only the yes is remembered: a database can gain a column while the
 * server is running, and will not lose one.
 * ------------------------------------------------------------------ */

let eventReviewSeen = false;
let rosterPeopleSeen = false;

/** Whether events carry a review status yet. */
export const hasEventReview = cache(async (): Promise<boolean> => {
  if (eventReviewSeen) return true;

  const supabase = await createClient();
  const { error } = await supabase.from("events").select("status").limit(1);

  if (!error) eventReviewSeen = true;
  return eventReviewSeen;
});

/** Whether the roster can hold people who have no account. */
export const hasRosterPeople = cache(async (): Promise<boolean> => {
  if (rosterPeopleSeen) return true;

  const supabase = await createClient();
  const { error } = await supabase
    .from("team_members")
    .select("id, full_name")
    .limit(1);

  if (!error) rosterPeopleSeen = true;
  return rosterPeopleSeen;
});

const MEMBER_FIELDS = [
  "team_id",
  "profile_id",
  "role",
  "title",
  "sort_order",
  "joined_at",
  "profile:profiles(id, full_name, created_at)",
];

const MEMBER_PEOPLE_FIELDS = ["id", "full_name", "bio", "photo_url"];

export function memberSelect(withPeople: boolean): string {
  return (
    withPeople ? [...MEMBER_PEOPLE_FIELDS, ...MEMBER_FIELDS] : MEMBER_FIELDS
  ).join(", ");
}

/**
 * Rows in, whole members out.
 *
 * Before the roster migration there is no id column, so one is made from the
 * profile - the pair is unique either way, and the page only needs something
 * stable to key on.
 */
export function asMembers(rows: unknown[] | null | undefined): TeamMember[] {
  return (rows ?? []).map((row) => {
    const member = row as Record<string, unknown>;
    const profileId = (member.profile_id as string | null) ?? null;

    return {
      id: (member.id as string | undefined) ?? `profile-${profileId}`,
      team_id: member.team_id as string,
      profile_id: profileId,
      role: ((member.role as TeamRole | undefined) ?? "member") as TeamRole,
      title: (member.title as string | null) ?? null,
      sort_order: (member.sort_order as number | undefined) ?? 0,
      joined_at: (member.joined_at as string | undefined) ?? "",
      full_name: (member.full_name as string | null) ?? null,
      bio: (member.bio as string | null) ?? null,
      photo_url: (member.photo_url as string | null) ?? null,
      profile: (member.profile as TeamMember["profile"]) ?? null,
    };
  });
}
