import Link from "next/link";

import { EventCard } from "@/components/event-card";
import {
  ArrowRightIcon,
  CalendarIcon,
  HeartIcon,
  MapPinIcon,
  MessageIcon,
  SparkIcon,
  UsersIcon,
} from "@/components/icons";
import { PostCard } from "@/components/post-card";
import { SetupNotice } from "@/components/setup-notice";
import { getCurrentTeam } from "@/lib/auth";
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

const STEPS = [
  {
    icon: UsersIcon,
    title: "Register your team once",
    body: "One account per team, keyed to your FTC number. Share the login with whoever runs your outreach.",
  },
  {
    icon: CalendarIcon,
    title: "Put your events on the map",
    body: "Scrimmage, workshop, outreach day, build party - add it and every team in the country sees it.",
  },
  {
    icon: MessageIcon,
    title: "Stop working in isolation",
    body: "Ask the question your team is stuck on, leave feedback on events you attended, find alliance partners.",
  },
];

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

  if (configured) {
    const supabase = await createClient();
    const nowIso = new Date().toISOString();

    const [eventRes, postRes, team] = await Promise.all([
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
      getCurrentTeam(),
    ]);

    events = (eventRes.data ?? []) as unknown as EventWithTeam[];
    posts = (postRes.data ?? []) as unknown as PostWithTeam[];
    signedIn = Boolean(team);
    [likedEvents, likedPosts] = await Promise.all([
      likedEventIds(team?.id),
      likedPostIds(team?.id),
    ]);
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 size-[640px] -translate-x-1/2 rounded-full bg-brand/18 blur-[120px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -bottom-56 size-[460px] rounded-full bg-accent/10 blur-[120px]"
        />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="eyebrow">For FTC teams, by an FTC team</p>

          <h1 className="mt-4 max-w-3xl text-4xl leading-[1.05] font-semibold sm:text-5xl md:text-6xl">
            Every team, every event,
            <span className="text-brand"> one hub</span>.
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-fg-muted">
            Momentum Hub is where FTC teams publish their scrimmages and
            workshops, find out what is happening in other cities, and talk to
            each other instead of guessing.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href={signedIn ? "/events/new" : "/signup"}
              className="btn btn-primary"
            >
              {signedIn ? "Add an event" : "Register your team"}
              <ArrowRightIcon className="size-4" />
            </Link>
            <Link href="/events" className="btn btn-outline">
              Browse events
            </Link>
          </div>

          {configured ? (
            <dl className="mt-14 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                { label: "Teams", value: stats.teams },
                { label: "Events", value: stats.events },
                { label: "Cities", value: stats.cities },
                { label: "Posts", value: stats.posts },
              ].map((stat) => (
                <div key={stat.label}>
                  <dd className="font-display text-3xl font-semibold">
                    {stat.value}
                  </dd>
                  <dt className="mt-1 text-xs tracking-wider text-fg-dim uppercase">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </section>

      {!configured ? (
        <section className="px-4 py-16 sm:px-6">
          <SetupNotice />
        </section>
      ) : null}

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="section-title">How it works</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="card p-6">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl border border-line bg-panel-2 text-brand">
                  <step.icon className="size-5" />
                </span>
                <span className="font-display text-2xl font-semibold text-line">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-fg-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming events */}
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
                canLike={signedIn}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Features */}
      <section className="border-y border-line bg-panel/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="section-title">What you get</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-panel text-brand">
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

      {/* Community preview */}
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
                canLike={signedIn}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Closing CTA */}
      {!signedIn ? (
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="card relative overflow-hidden p-8 text-center sm:p-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-32 left-1/2 size-[420px] -translate-x-1/2 rounded-full bg-brand/15 blur-[100px]"
            />
            <div className="relative">
              <h2 className="text-2xl font-semibold sm:text-3xl">
                Put your team on the hub
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-fg-muted">
                It takes a minute: your team number, a name and a password your
                team shares.
              </p>
              <Link href="/signup" className="btn btn-primary mt-7">
                Register your team
                <ArrowRightIcon className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
