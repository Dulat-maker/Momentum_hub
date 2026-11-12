import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EventCard } from "@/components/event-card";
import {
  CalendarIcon,
  GlobeIcon,
  InstagramIcon,
  MailIcon,
  MapPinIcon,
  MessageIcon,
  PencilIcon,
  SparkIcon,
  UsersIcon,
} from "@/components/icons";
import { SetupNotice } from "@/components/setup-notice";
import { TeamAvatar } from "@/components/team-avatar";
import { getCurrentTeam } from "@/lib/auth";
import { externalHref, prettyHostname, timeAgo } from "@/lib/format";
import { EVENT_CARD_SELECT, likedEventIds } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  CATEGORY_LABELS,
  type EventWithTeam,
  type PostRow,
  type Team,
  type TeamMember,
} from "@/lib/types";

async function loadTeam(teamNumber: number): Promise<Team | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teams")
    .select("*")
    .eq("team_number", teamNumber)
    .maybeSingle();

  return (data as Team | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ number: string }>;
}): Promise<Metadata> {
  if (!isSupabaseConfigured) return { title: "Team" };

  const { number } = await params;
  const teamNumber = Number(number);
  if (!Number.isInteger(teamNumber)) return { title: "Team not found" };

  const team = await loadTeam(teamNumber);
  if (!team) return { title: "Team not found" };

  return {
    title: `#${team.team_number} ${team.name}`,
    description:
      team.about ??
      `FTC team ${team.team_number} from ${team.city ?? "unknown city"}.`,
  };
}

export default async function TeamProfilePage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  if (!isSupabaseConfigured) {
    return (
      <div className="px-4 py-16 sm:px-6">
        <SetupNotice />
      </div>
    );
  }

  const { number } = await params;
  const teamNumber = Number(number);
  if (!Number.isInteger(teamNumber) || teamNumber <= 0) notFound();

  const team = await loadTeam(teamNumber);
  if (!team) notFound();

  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const [memberRes, upcomingRes, pastRes, postRes, viewer] = await Promise.all([
    supabase
      .from("team_members")
      .select("id, team_id, full_name, role, grade, sort_order")
      .eq("team_id", team.id)
      .order("sort_order", { ascending: true })
      .order("full_name", { ascending: true }),
    supabase
      .from("events")
      .select(EVENT_CARD_SELECT)
      .eq("team_id", team.id)
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true }),
    supabase
      .from("events")
      .select(EVENT_CARD_SELECT)
      .eq("team_id", team.id)
      .lt("starts_at", nowIso)
      .order("starts_at", { ascending: false })
      .limit(4),
    supabase
      .from("posts")
      .select("id, team_id, title, body, category, created_at")
      .eq("team_id", team.id)
      .order("created_at", { ascending: false })
      .limit(4),
    getCurrentTeam(),
  ]);

  const members = (memberRes.data ?? []) as unknown as TeamMember[];
  const upcoming = (upcomingRes.data ?? []) as unknown as EventWithTeam[];
  const past = (pastRes.data ?? []) as unknown as EventWithTeam[];
  const posts = (postRes.data ?? []) as unknown as PostRow[];
  const liked = await likedEventIds(viewer?.id);
  const isOwnTeam = viewer?.id === team.id;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/teams"
        className="text-sm text-fg-muted transition-colors hover:text-fg"
      >
        &larr; All teams
      </Link>

      <header className="card mt-6 p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <TeamAvatar name={team.name} logoUrl={team.logo_url} size="xl" />

          <div className="min-w-0 flex-1">
            <p className="font-display text-3xl font-semibold">
              <span className="text-brand">#</span>
              {team.team_number}
            </p>
            <h1 className="mt-1 text-2xl font-semibold">{team.name}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-fg-muted">
              <span className="inline-flex items-center gap-1.5">
                <MapPinIcon className="size-4" />
                {[team.city, team.country].filter(Boolean).join(", ") ||
                  "Location not set"}
              </span>
              {team.rookie_year ? (
                <span className="inline-flex items-center gap-1.5">
                  <SparkIcon className="size-4" />
                  Rookie year {team.rookie_year}
                </span>
              ) : null}
              {team.organization ? (
                <span className="inline-flex items-center gap-1.5">
                  <UsersIcon className="size-4" />
                  {team.organization}
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {team.website ? (
                <a
                  href={externalHref(team.website)}
                  target="_blank"
                  rel="noreferrer"
                  className="chip hover:text-fg"
                >
                  <GlobeIcon className="size-3.5" />
                  {prettyHostname(team.website)}
                </a>
              ) : null}
              {team.instagram ? (
                <a
                  href={externalHref(
                    team.instagram.startsWith("@")
                      ? `instagram.com/${team.instagram.slice(1)}`
                      : team.instagram,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="chip hover:text-fg"
                >
                  <InstagramIcon className="size-3.5" />
                  Instagram
                </a>
              ) : null}
              {team.contact_email ? (
                <a
                  href={`mailto:${team.contact_email}`}
                  className="chip hover:text-fg"
                >
                  <MailIcon className="size-3.5" />
                  {team.contact_email}
                </a>
              ) : null}
            </div>
          </div>

          {isOwnTeam ? (
            <Link href="/dashboard" className="btn btn-outline btn-sm shrink-0">
              <PencilIcon className="size-4" />
              Edit profile
            </Link>
          ) : null}
        </div>

        {team.about ? (
          <p className="mt-6 border-t border-line pt-6 text-sm leading-relaxed whitespace-pre-line text-fg-muted">
            {team.about}
          </p>
        ) : null}
      </header>

      <section className="mt-12">
        <h2 className="section-title flex items-center gap-2 text-xl sm:text-2xl">
          <UsersIcon className="size-5 text-fg-dim" />
          Roster
          <span className="text-sm font-normal text-fg-dim">
            {members.length}
          </span>
        </h2>

        {members.length === 0 ? (
          <p className="mt-4 text-sm text-fg-dim">
            This team has not published its roster yet.
          </p>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <div key={member.id} className="card flex items-center gap-3 p-4">
                <TeamAvatar name={member.full_name} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {member.full_name}
                  </p>
                  <p className="truncate text-xs text-fg-dim">
                    {[member.role, member.grade].filter(Boolean).join(" · ") ||
                      "Team member"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="section-title flex items-center gap-2 text-xl sm:text-2xl">
          <CalendarIcon className="size-5 text-fg-dim" />
          Events they host
        </h2>

        {upcoming.length === 0 && past.length === 0 ? (
          <p className="mt-4 text-sm text-fg-dim">
            No events from this team yet.
          </p>
        ) : null}

        {upcoming.length > 0 ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {upcoming.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                liked={liked.has(event.id)}
                canLike={Boolean(viewer)}
              />
            ))}
          </div>
        ) : null}

        {past.length > 0 ? (
          <>
            <p className="mt-8 mb-4 text-xs tracking-wider text-fg-dim uppercase">
              Past
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              {past.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  liked={liked.has(event.id)}
                  canLike={Boolean(viewer)}
                />
              ))}
            </div>
          </>
        ) : null}
      </section>

      {posts.length > 0 ? (
        <section className="mt-12">
          <h2 className="section-title flex items-center gap-2 text-xl sm:text-2xl">
            <MessageIcon className="size-5 text-fg-dim" />
            In the community
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/community/${post.id}`}
                className="card card-link p-4"
              >
                <div className="flex items-center gap-2 text-xs text-fg-dim">
                  <span className="chip border-accent/25 text-accent">
                    {CATEGORY_LABELS[post.category]}
                  </span>
                  <span>{timeAgo(post.created_at)}</span>
                </div>
                <p className="mt-2 font-medium">{post.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-fg-muted">
                  {post.body}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
