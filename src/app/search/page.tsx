import type { Metadata } from "next";
import Link from "next/link";

import { AutoSubmitForm } from "@/components/auto-submit-form";
import { EventCard } from "@/components/event-card";
import { CalendarIcon, MessageIcon, SearchIcon, UsersIcon } from "@/components/icons";
import { PostCard } from "@/components/post-card";
import { SetupNotice } from "@/components/setup-notice";
import { TeamAvatar } from "@/components/team-avatar";
import { TeamTag } from "@/components/team-tag";
import { getCurrentTeam } from "@/lib/auth";
import {
  EVENT_CARD_SELECT,
  POST_CARD_SELECT,
  describeQueryError,
  likedEventIds,
  likedPostIds,
  sanitizeSearch,
} from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  type EventWithTeam,
  type PostWithTeam,
  type Program,
  teamHref,
} from "@/lib/types";

export const metadata: Metadata = {
  title: "Search",
  description: "Search events, teams and community posts across the hub.",
};

type TeamHit = {
  id: string;
  program: Program;
  team_number: number;
  name: string;
  city: string | null;
  country: string | null;
  logo_url: string | null;
};

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function SearchPage({
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
  const raw = first(params.q);
  const query = sanitizeSearch(raw);

  let events: EventWithTeam[] = [];
  let posts: PostWithTeam[] = [];
  let teams: TeamHit[] = [];
  let problem: string | null = null;
  let likedEvents = new Set<string>();
  let likedPosts = new Set<string>();
  let signedIn = false;

  if (query) {
    const supabase = await createClient();
    const numeric = Number(query);

    const teamFilters = [`name.ilike.%${query}%`, `city.ilike.%${query}%`];
    if (Number.isInteger(numeric) && numeric > 0) {
      teamFilters.push(`team_number.eq.${numeric}`);
    }

    const [eventRes, teamRes, postRes, team] = await Promise.all([
      supabase
        .from("events")
        .select(EVENT_CARD_SELECT)
        .or(
          `title.ilike.%${query}%,summary.ilike.%${query}%,description.ilike.%${query}%,city.ilike.%${query}%,venue.ilike.%${query}%`,
        )
        .order("starts_at", { ascending: false })
        .limit(20),
      supabase
        .from("teams")
        .select("id, program, team_number, name, city, country, logo_url")
        .or(teamFilters.join(","))
        .order("team_number", { ascending: true })
        .limit(20),
      supabase
        .from("posts")
        .select(POST_CARD_SELECT)
        .or(`title.ilike.%${query}%,body.ilike.%${query}%`)
        .order("created_at", { ascending: false })
        .limit(20),
      getCurrentTeam(),
    ]);

    events = (eventRes.data ?? []) as unknown as EventWithTeam[];
    teams = (teamRes.data ?? []) as unknown as TeamHit[];
    posts = (postRes.data ?? []) as unknown as PostWithTeam[];
    problem =
      describeQueryError(eventRes.error) ??
      describeQueryError(teamRes.error) ??
      describeQueryError(postRes.error);

    signedIn = Boolean(team);
    [likedEvents, likedPosts] = await Promise.all([
      likedEventIds(team?.id),
      likedPostIds(team?.id),
    ]);
  }

  const total = events.length + teams.length + posts.length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <div>
        <p className="eyebrow">Everything at once</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Search</h1>
        <p className="mt-2 max-w-xl text-fg-muted">
          Events, teams and community posts in one place.
        </p>
      </div>

      <AutoSubmitForm action="/search" className="card mt-8 p-4">
        <label className="field-label" htmlFor="search-q">
          Search the hub
        </label>
        <div className="flex gap-3">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-dim" />
            <input
              id="search-q"
              name="q"
              defaultValue={raw}
              autoFocus
              className="input pl-9"
              placeholder="Team number, city, a word from a title"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </div>
      </AutoSubmitForm>

      {problem ? (
        <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {problem}
        </p>
      ) : null}

      {!query ? (
        <p className="mt-10 text-sm text-fg-dim">
          Type something above. Team numbers work too.
        </p>
      ) : total === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="font-semibold">Nothing matches &quot;{raw}&quot;</p>
          <p className="mt-2 text-sm text-fg-muted">
            Try a shorter word, or a city name.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-12">
          <p className="text-sm text-fg-dim">
            {total} {total === 1 ? "result" : "results"} for &quot;{raw}&quot;
          </p>

          {events.length > 0 ? (
            <section>
              <h2 className="section-title flex items-center gap-2 text-xl">
                <CalendarIcon className="size-5 text-fg-dim" />
                Events
                <span className="text-sm font-normal text-fg-dim">
                  {events.length}
                </span>
              </h2>
              <div className="mt-5 grid gap-4">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    liked={likedEvents.has(event.id)}
                    canLike={signedIn}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {teams.length > 0 ? (
            <section>
              <h2 className="section-title flex items-center gap-2 text-xl">
                <UsersIcon className="size-5 text-fg-dim" />
                Teams
                <span className="text-sm font-normal text-fg-dim">
                  {teams.length}
                </span>
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {teams.map((team) => (
                  <Link
                    key={team.id}
                    href={teamHref(team)}
                    className="card card-link flex items-center gap-3 p-4"
                  >
                    <TeamAvatar
                      name={team.name}
                      logoUrl={team.logo_url}
                      size="md"
                    />
                    <div className="min-w-0">
                      <TeamTag team={team} className="block text-sm" />
                      <p className="truncate text-xs text-fg-dim">
                        {[team.city, team.country].filter(Boolean).join(", ") ||
                          "Location not set"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {posts.length > 0 ? (
            <section>
              <h2 className="section-title flex items-center gap-2 text-xl">
                <MessageIcon className="size-5 text-fg-dim" />
                Community
                <span className="text-sm font-normal text-fg-dim">
                  {posts.length}
                </span>
              </h2>
              <div className="mt-5 grid gap-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    liked={likedPosts.has(post.id)}
                    canLike={signedIn}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
