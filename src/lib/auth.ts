import { redirect } from "next/navigation";
import { cache } from "react";

import { isSupabaseConfigured } from "./supabase/config";
import { createClient } from "./supabase/server";
import type { Team } from "./types";

/**
 * The signed-in team, or null. One account == one team, so the auth user id is
 * also the team id.
 *
 * If the auth user exists but the profile row does not (for example the SQL
 * trigger was not installed yet), the profile is created from the sign-up
 * metadata so the account never ends up in a broken half-state.
 *
 * Wrapped in React's `cache` so the header and the page body share one lookup
 * per request instead of hitting Supabase twice.
 */
export const getCurrentTeam = cache(async (): Promise<Team | null> => {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();

  // Treat an unreachable Supabase as "signed out" rather than taking down
  // every page on the site, including the ones that need no data at all.
  let user;
  try {
    ({
      data: { user },
    } = await supabase.auth.getUser());
  } catch {
    return null;
  }

  if (!user) return null;

  const { data } = await supabase
    .from("teams")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (data) return data as Team;

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const teamNumber = Number(meta.team_number);

  if (!Number.isFinite(teamNumber) || teamNumber <= 0) return null;

  const { data: created } = await supabase
    .from("teams")
    .insert({
      id: user.id,
      team_number: teamNumber,
      name: typeof meta.team_name === "string" ? meta.team_name : "Unnamed team",
      city: typeof meta.city === "string" ? meta.city : "",
      country: typeof meta.country === "string" ? meta.country : "Kazakhstan",
    })
    .select("*")
    .maybeSingle();

  return (created as Team | null) ?? null;
});

export async function requireTeam(returnTo?: string): Promise<Team> {
  const team = await getCurrentTeam();
  if (team) return team;

  const target = returnTo
    ? `/login?next=${encodeURIComponent(returnTo)}`
    : "/login";
  redirect(target);
}
