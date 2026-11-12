import type { Metadata } from "next";
import Link from "next/link";

import { AutoSubmitForm } from "@/components/auto-submit-form";
import { EmptyState } from "@/components/empty-state";
import { CalendarIcon, SearchIcon, UsersIcon } from "@/components/icons";
import { SetupNotice } from "@/components/setup-notice";
import { TeamAvatar } from "@/components/team-avatar";
import { sanitizeSearch } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { type AggregateCount, countOf } from "@/lib/types";

export const metadata: Metadata = {
  title: "Teams",
  description: "Every FTC team registered on Momentum Hub, with rosters and events.",
};

type TeamListRow = {
  id: string;
  team_number: number;
  name: string;
  city: string | null;
  country: string | null;
  logo_url: string | null;
  about: string | null;
  rookie_year: number | null;
  events: AggregateCount;
  members: AggregateCount;
};

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function TeamsPage({
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
  const search = sanitizeSearch(first(params.q));
  const city = first(params.city);

  const supabase = await createClient();

  let query = supabase
    .from("teams")
    .select(
      "id, team_number, name, city, country, logo_url, about, rookie_year, events(count), members:team_members(count)",
    )
    .order("team_number", { ascending: true });

  if (city) query = query.eq("city", city);

  if (search) {
    const numeric = Number(search);
    const filters = [`name.ilike.%${search}%`, `city.ilike.%${search}%`];
    if (Number.isInteger(numeric) && numeric > 0) {
      filters.push(`team_number.eq.${numeric}`);
    }
    query = query.or(filters.join(","));
  }

  const { data, error } = await query.limit(200);
  const teams = (data ?? []) as unknown as TeamListRow[];

  const { data: cityRows } = await supabase.from("teams").select("city");
  const cities = [
    ...new Set(
      (cityRows ?? [])
        .map((row) => (row.city as string | null)?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort((a, b) => a.localeCompare(b));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div>
        <p className="eyebrow">Who is here</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Teams</h1>
        <p className="mt-2 max-w-xl text-fg-muted">
          Every team with an account on the hub. Open a profile to see the
          roster, the story and the events they run.
        </p>
      </div>

      <AutoSubmitForm
        action="/teams"
        className="card mt-8 flex flex-wrap items-end gap-3 p-4"
      >
        <div className="min-w-55 flex-1">
          <label className="field-label" htmlFor="team-q">
            Search
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-dim" />
            <input
              id="team-q"
              name="q"
              defaultValue={search}
              className="input pl-9"
              placeholder="Team number, name or city"
            />
          </div>
        </div>

        <div className="min-w-36">
          <label className="field-label" htmlFor="team-city">
            City
          </label>
          <select
            id="team-city"
            name="city"
            defaultValue={city}
            className="input"
          >
            <option value="">Everywhere</option>
            {cities.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button type="submit" className="btn btn-outline">
            Apply
          </button>
          {search || city ? (
            <Link href="/teams" className="btn btn-ghost">
              Reset
            </Link>
          ) : null}
        </div>
      </AutoSubmitForm>

      {error ? (
        <p className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Could not load teams: {error.message}
        </p>
      ) : null}

      <p className="mt-8 mb-4 text-sm text-fg-dim">
        {teams.length} {teams.length === 1 ? "team" : "teams"}
      </p>

      {teams.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="size-6" />}
          title="No teams found"
          body="Nobody matches that search yet. If your team is missing, register it - it takes a minute."
          actionLabel="Register your team"
          actionHref="/signup"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.team_number}`}
              className="card card-link flex flex-col p-5"
            >
              <div className="flex items-center gap-3">
                <TeamAvatar
                  name={team.name}
                  logoUrl={team.logo_url}
                  size="lg"
                />
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold">
                    #{team.team_number}
                  </p>
                  <p className="truncate text-sm text-fg-muted">{team.name}</p>
                </div>
              </div>

              <p className="mt-3 text-xs text-fg-dim">
                {[team.city, team.country].filter(Boolean).join(", ") ||
                  "Location not set"}
                {team.rookie_year ? ` · rookie ${team.rookie_year}` : ""}
              </p>

              {team.about ? (
                <p className="mt-3 line-clamp-3 text-sm text-fg-muted">
                  {team.about}
                </p>
              ) : null}

              <div className="mt-4 flex gap-2 border-t border-line pt-3 text-xs">
                <span className="chip">
                  <CalendarIcon className="size-3.5" />
                  {countOf(team.events)} events
                </span>
                <span className="chip">
                  <UsersIcon className="size-3.5" />
                  {countOf(team.members)} members
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
