import { redirect } from "next/navigation";
import { cache } from "react";

import { isSupabaseConfigured } from "./supabase/config";
import { createClient } from "./supabase/server";
import type { Profile, Team, TeamRole } from "./types";

export type Membership = { team: Team; role: TeamRole };

/** True while the people-and-teams migration has not been run yet. */
function behindOnMigrations(code?: string, message?: string): boolean {
  return (
    code === "42P01" ||
    code === "42703" ||
    code === "PGRST200" ||
    code === "PGRST205" ||
    /does not exist|could not find (a relationship|the table)/i.test(
      message ?? "",
    )
  );
}

/**
 * The signed-in account: the auth user, nothing more.
 *
 * The email is here because invites are addressed to it, and the app has to
 * be able to say "this invite is for you" without a round trip to the server
 * for the token.
 */
export const getCurrentUser = cache(
  async (): Promise<{ id: string; email: string | null } | null> => {
    if (!isSupabaseConfigured) return null;

    const supabase = await createClient();

    // Treat an unreachable Supabase as "signed out" rather than taking down
    // every page on the site, including the ones that need no data at all.
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      return user ? { id: user.id, email: user.email ?? null } : null;
    } catch {
      return null;
    }
  },
);

/**
 * The signed-in person, or null.
 *
 * An account is a person now - a team is something they create or are invited
 * into - so this, not the team, is what "signed in" means.
 *
 * If the auth user exists but the profile row does not (the trigger was not
 * installed when they signed up), it is created from the sign-up metadata so
 * the account never ends up in a broken half-state.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (data) return data as Profile;

  const { data: created } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      full_name: user.email?.split("@")[0] ?? "Someone",
    })
    .select("*")
    .maybeSingle();

  return (created as Profile | null) ?? null;
});

/**
 * The team the signed-in person is on, with their role in it.
 *
 * Null covers three different situations on purpose - signed out, signed in
 * without a team, and the database still being on the old shape - because all
 * three mean the same thing to a caller: there is no team to act for.
 */
export const getCurrentMembership = cache(
  async (): Promise<Membership | null> => {
    const user = await getCurrentUser();
    if (!user) return null;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("team_members")
      .select("role, team:teams(*)")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (error) {
      if (behindOnMigrations(error.code, error.message)) return null;
      return null;
    }

    const team = (data?.team ?? null) as Team | null;
    if (!team) return null;

    return { team, role: (data?.role as TeamRole) ?? "member" };
  },
);

/** The team the signed-in person is on, or null. */
export const getCurrentTeam = cache(async (): Promise<Team | null> => {
  const membership = await getCurrentMembership();
  return membership?.team ?? null;
});

function loginHref(returnTo?: string): string {
  return returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login";
}

/** Signed in as somebody, or off to the log-in page. */
export async function requireProfile(returnTo?: string): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (profile) return profile;

  redirect(loginHref(returnTo));
}

/**
 * On a team, or off to make one.
 *
 * Someone signed in without a team is not an error - it is the normal state
 * between registering and either creating a team or taking up an invite - so
 * they go to the page that offers both rather than to the log-in form.
 */
export async function requireMembership(
  returnTo?: string,
): Promise<Membership> {
  await requireProfile(returnTo);

  const membership = await getCurrentMembership();
  if (membership) return membership;

  redirect("/dashboard");
}

export async function requireTeam(returnTo?: string): Promise<Team> {
  const { team } = await requireMembership(returnTo);
  return team;
}
