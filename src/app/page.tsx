import Image from "next/image";
import Link from "next/link";

import { CinematicFooter } from "@/components/cinematic-footer";
import { EventCard } from "@/components/event-card";
import {
  ArrowRightIcon,
  CalendarIcon,
  HeartIcon,
  MapPinIcon,
  MessageIcon,
  SparkIcon,
  SparkMark,
  UsersIcon,
} from "@/components/icons";
import { PostCard } from "@/components/post-card";
import { SetupNotice } from "@/components/setup-notice";
import { getCurrentProfile, getCurrentTeam } from "@/lib/auth";
import {
  EVENT_CARD_SELECT,
  POST_CARD_SELECT,
  hubStats,
  likedEventIds,
  likedPostIds,
} from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { EventWithTeam, PostWithTeam } from "@/lib/types";

const FEATURES = [
  {
    icon: MapPinIcon,
    title: "Events with real detail",
    body: "City, venue, format, cost, spots and a registration link - not a message buried in a group chat.",
  },
  {
    icon: HeartIcon,
    title: "Likes that mean something",
    body: "Hosts can see how many teams are actually interested before they book a hall.",
  },
  {
    icon: SparkIcon,
    title: "Feedback after the event",
    body: "Star ratings and written reviews from the teams that came, visible to everyone.",
  },
  {
    icon: UsersIcon,
    title: "Team profiles and rosters",
    body: "Who you are, where you are from, who is on the team and what you have built.",
  },
];

export default async function HomePage() {
  const configured = isSupabaseConfigured;

  const stats = configured
    ? await hubStats()
    : { teams: 0, events: 0, cities: 0, posts: 0 };

  let events: EventWithTeam[] = [];
  let posts: PostWithTeam[] = [];
  let likedEvents = new Set<string>();
  let likedPosts = new Set<string>();
  let signedIn = false;
  let hasTeam = false;

  if (configured) {
    const supabase = await createClient();
    const nowIso = new Date().toISOString();

    const [eventRes, postRes, profile, team] = await Promise.all([
      supabase
        .from("events")
        .select(EVENT_CARD_SELECT)
        .gte("starts_at", nowIso)
        .order("starts_at", { ascending: true })
        .limit(4),
      supabase
        .from("posts")
        .select(POST_CARD_SELECT)
        .order("created_at", { ascending: false })
        .limit(3),
      getCurrentProfile(),
      getCurrentTeam(),
    ]);

    events = (eventRes.data ?? []) as unknown as EventWithTeam[];
    posts = (postRes.data ?? []) as unknown as PostWithTeam[];
    signedIn = Boolean(profile);
    hasTeam = Boolean(team);
    [likedEvents, likedPosts] = await Promise.all([
      likedEventIds(team?.id),
      likedPostIds(team?.id),
    ]);
  }

  const sections = [
    {
      href: "/events",
      icon: CalendarIcon,
      label: "Events",
      count: stats.events,
      countLabel: stats.events === 1 ? "event posted" : "events posted",
      body: "Scrimmages, workshops and outreach days from every team, filtered by city and format.",
    },
    {
      href: "/teams",
      icon: UsersIcon,
      label: "Teams",
      count: stats.teams,
      countLabel: stats.teams === 1 ? "team registered" : "teams registered",
      body: "Who is competing, where they are based and who is on the roster.",
    },
    {
      href: "/community",
      icon: MessageIcon,
      label: "Community",
      count: stats.posts,
      countLabel: stats.posts === 1 ? "post" : "posts",
      body: "Ask for help with code or CAD, show what you built, find an alliance partner.",
    },
  ];

  return (
    <div>
      {/* ---------------------------------------------------------- intro -- */}
      {/* A screen of its own that only points downwards, the way the
          reference page opens. 4rem is the header, so it fills exactly what
          is left of the viewport. */}
      <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 sm:px-6">
        {/* Not an <h1>: the hero below holds the page's real heading, and two
            of them would leave screen readers with competing titles. */}
        <p className="font-display max-w-3xl text-center text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
          Stay in motion.{" "}
          <span className="bg-gradient-to-r from-brand-soft via-brand-mid to-brand bg-clip-text text-transparent">
            Stay in momentum
          </span>
        </p>

        <p className="mt-10 text-center text-xs font-light tracking-[0.3em] text-fg-dim uppercase sm:text-sm">
          Scroll down to reveal
        </p>
        <div
          aria-hidden="true"
          className="mt-6 h-24 w-px bg-gradient-to-b from-fg-dim to-transparent"
        />
      </section>

      {/* ----------------------------------------------------------- hero -- */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-72 left-1/2 size-[820px] -translate-x-1/2 rounded-full bg-brand/25 blur-[140px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-40 -left-52 size-[420px] rounded-full bg-brand-deep/30 blur-[130px]"
        />

        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 pt-16 pb-20 text-center sm:px-6 sm:pt-24 sm:pb-28">
          {/* The team number is pinned under the MOMENTUM wordmark rather
              than under the whole image: the wordmark occupies 36.1%-91.4%
              of the image width and ends at 66.8% of its height, measured
              from the artwork itself. */}
          <div className="relative w-72 sm:w-88">
            <Image
              src="/logo-lockup.png"
              alt="Momentum"
              width={360}
              height={202}
              priority
              className="logo-blend h-auto w-full"
            />
            <span
              className="font-display absolute block pl-[0.15em] text-center text-sm font-semibold tracking-[0.3em] text-brand-soft sm:text-base"
              style={{ left: "36.11%", width: "55.28%", top: "71%" }}
            >
              #38157
            </span>
          </div>

          <h1 className="mt-6 text-4xl leading-[1.06] font-semibold sm:text-5xl md:text-6xl">
            The home base for
            <br />
            <span className="bg-gradient-to-r from-brand-soft via-brand-mid to-brand bg-clip-text text-transparent">
              FTC &amp; FLL teams
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-fg-muted">
            An account of your own, a team you join, and one calendar for the
            scrimmages and workshops everybody is running - plus the teams you
            will be standing next to at the next competition.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={signedIn ? "/dashboard" : "/signup"}
              className="btn btn-primary"
            >
              {signedIn ? "Your team" : "Create an account"}
              <ArrowRightIcon className="size-4" />
            </Link>
            <Link href="/events" className="btn btn-outline">
              Browse events
            </Link>
          </div>

        </div>
      </section>

      {!configured ? (
        <section className="px-4 pb-16 sm:px-6">
          <SetupNotice />
        </section>
      ) : null}

      {/* ------------------------------------------------- the three areas -- */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="grid gap-4 md:grid-cols-3">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="card card-link group relative overflow-hidden p-6"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-brand/20 blur-3xl transition-colors group-hover:bg-brand/35"
              />
              <div className="relative">
                <span className="grid size-11 place-items-center rounded-xl border border-line bg-panel-2 text-brand-mid">
                  <section.icon className="size-5" />
                </span>

                <h2 className="mt-5 flex items-center gap-2 text-lg font-semibold">
                  {section.label}
                  <ArrowRightIcon className="size-4 text-fg-dim transition-transform group-hover:translate-x-1" />
                </h2>

                <p className="mt-2 text-sm text-fg-muted">{section.body}</p>

                {configured ? (
                  <p className="mt-5 flex items-baseline gap-2 border-t border-line pt-4">
                    <span className="font-display text-2xl font-semibold text-brand-soft">
                      {section.count}
                    </span>
                    <span className="text-xs text-fg-dim">
                      {section.countLabel}
                    </span>
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------- upcoming events -- */}
      {configured && events.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Coming up</p>
              <h2 className="section-title mt-2">Next on the calendar</h2>
            </div>
            <Link href="/events" className="btn btn-outline btn-sm">
              All events
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                liked={likedEvents.has(event.id)}
                canLike={hasTeam}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* -------------------------------------------------------- features -- */}
      <section className="relative overflow-hidden border-y border-line">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 -right-40 size-[400px] -translate-y-1/2 rounded-full bg-brand-deep/20 blur-[120px]"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="flex items-center gap-3">
            <SparkMark className="size-5 text-brand-soft" />
            <p className="eyebrow">Why it helps</p>
          </div>
          <h2 className="section-title mt-3">What you get</h2>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-panel text-brand-mid">
                  <feature.icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-sm text-fg-muted">{feature.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------- community preview -- */}
      {configured && posts.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Team to team</p>
              <h2 className="section-title mt-2">From the community</h2>
            </div>
            <Link href="/community" className="btn btn-outline btn-sm">
              Open community
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                liked={likedPosts.has(post.id)}
                canLike={hasTeam}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* The cinematic footer carries the closing call to action, so the home
          page skips the plain one in the layout - see SiteFooterSlot. */}
      <CinematicFooter />
    </div>
  );
}
