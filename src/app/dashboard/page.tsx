import type { Metadata } from "next";
import Link from "next/link";

import { SuccessAlert } from "@/components/alert";
import {
  ArrowUpRightIcon,
  CalendarIcon,
  HeartIcon,
  MessageIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/icons";
import { MemberForm } from "@/components/member-form";
import { IconSubmitButton } from "@/components/submit-button";
import { TeamAvatar } from "@/components/team-avatar";
import { TeamProfileForm } from "@/components/team-profile-form";
import { deletePostAction } from "@/lib/actions/community";
import { deleteEventAction } from "@/lib/actions/events";
import { removeMemberAction } from "@/lib/actions/teams";
import { requireTeam } from "@/lib/auth";
import { calendarTile, formatEventWhen, timeAgo } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import {
  type AggregateCount,
  CATEGORY_LABELS,
  type PostRow,
  type TeamMember,
  countOf,
} from "@/lib/types";

export const metadata: Metadata = { title: "Team dashboard" };

type MyEvent = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  city: string;
  likes: AggregateCount;
  feedback: AggregateCount;
};

type MyPost = PostRow & { likes: AggregateCount; comments: AggregateCount };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const team = await requireTeam("/dashboard");
  const params = await searchParams;

  const supabase = await createClient();

  const [memberRes, eventRes, postRes] = await Promise.all([
    supabase
      .from("team_members")
      .select("id, team_id, full_name, role, grade, sort_order")
      .eq("team_id", team.id)
      .order("sort_order", { ascending: true })
      .order("full_name", { ascending: true }),
    supabase
      .from("events")
      .select(
        "id, title, starts_at, ends_at, city, likes:event_likes(count), feedback:event_feedback(count)",
      )
      .eq("team_id", team.id)
      .order("starts_at", { ascending: false }),
    supabase
      .from("posts")
      .select(
        "id, team_id, title, body, category, created_at, likes:post_likes(count), comments:post_comments(count)",
      )
      .eq("team_id", team.id)
      .order("created_at", { ascending: false }),
  ]);

  const members = (memberRes.data ?? []) as unknown as TeamMember[];
  const events = (eventRes.data ?? []) as unknown as MyEvent[];
  const posts = (postRes.data ?? []) as unknown as MyPost[];

  const nextSortOrder =
    members.length > 0
      ? Math.max(...members.map((member) => member.sort_order)) + 1
      : 0;

  const totalLikes = events.reduce(
    (sum, event) => sum + countOf(event.likes),
    0,
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex items-center gap-4">
          <TeamAvatar name={team.name} logoUrl={team.logo_url} size="xl" />
          <div>
            <p className="eyebrow">Your team</p>
            <h1 className="mt-1.5 text-2xl font-semibold sm:text-3xl">
              <span className="text-brand">#</span>
              {team.team_number} {team.name}
            </h1>
            <p className="mt-1 text-sm text-fg-muted">
              {[team.city, team.country].filter(Boolean).join(", ") ||
                "Add your city below"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/teams/${team.team_number}`}
            className="btn btn-outline btn-sm"
          >
            Public page
            <ArrowUpRightIcon className="size-4" />
          </Link>
          <Link href="/events/new" className="btn btn-primary btn-sm">
            <PlusIcon className="size-4" />
            Add event
          </Link>
        </div>
      </header>

      {params.deleted === "event" ? (
        <div className="mt-6">
          <SuccessAlert message="Event deleted." />
        </div>
      ) : null}

      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        {[
          {
            label: "Events",
            value: events.length,
            icon: <CalendarIcon className="size-4" />,
          },
          {
            label: "Likes received",
            value: totalLikes,
            icon: <HeartIcon className="size-4" />,
          },
          {
            label: "Roster",
            value: members.length,
            icon: <UsersIcon className="size-4" />,
          },
          {
            label: "Posts",
            value: posts.length,
            icon: <MessageIcon className="size-4" />,
          },
        ].map((stat) => (
          <div key={stat.label} className="card p-4">
            <p className="flex items-center gap-2 text-xs tracking-wider text-fg-dim uppercase">
              {stat.icon}
              {stat.label}
            </p>
            <p className="font-display mt-2 text-2xl font-semibold">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="section-title text-xl sm:text-2xl">Your events</h2>

        {events.length === 0 ? (
          <p className="mt-4 text-sm text-fg-dim">
            Nothing posted yet.{" "}
            <Link href="/events/new" className="text-brand underline underline-offset-4">
              Add your first event
            </Link>
            .
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {events.map((event) => {
              const tile = calendarTile(event.starts_at);
              return (
                <div
                  key={event.id}
                  className="card flex flex-wrap items-center gap-4 p-4"
                >
                  <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl border border-line bg-panel-2">
                    <span className="text-[10px] font-semibold text-fg-dim">
                      {tile.month}
                    </span>
                    <span className="font-display leading-none font-semibold">
                      {tile.day}
                    </span>
                  </div>

                  <div className="min-w-50 flex-1">
                    <Link
                      href={`/events/${event.id}`}
                      className="font-medium hover:text-brand"
                    >
                      {event.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-fg-dim">
                      {formatEventWhen(event.starts_at, event.ends_at)}
                      {event.city ? ` · ${event.city}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="chip">
                      <HeartIcon className="size-3.5" />
                      {countOf(event.likes)}
                    </span>
                    <span className="chip">
                      <MessageIcon className="size-3.5" />
                      {countOf(event.feedback)}
                    </span>
                    <Link
                      href={`/events/${event.id}/edit`}
                      className="btn btn-ghost btn-sm"
                      title="Edit"
                    >
                      <PencilIcon className="size-4" />
                    </Link>
                    <form action={deleteEventAction}>
                      <input type="hidden" name="event_id" value={event.id} />
                      <IconSubmitButton title="Delete this event">
                        <TrashIcon className="size-4" />
                      </IconSubmitButton>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="section-title text-xl sm:text-2xl">Roster</h2>
        <p className="mt-2 text-sm text-fg-muted">
          Shown on your public team page. Order controls the sorting.
        </p>

        <div className="card mt-5 p-5">
          <MemberForm nextSortOrder={nextSortOrder} />

          {members.length > 0 ? (
            <ul className="mt-6 divide-y divide-line border-t border-line">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-3 py-3 text-sm"
                >
                  <TeamAvatar name={member.full_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{member.full_name}</p>
                    <p className="truncate text-xs text-fg-dim">
                      {[member.role, member.grade]
                        .filter(Boolean)
                        .join(" · ") || "Team member"}
                    </p>
                  </div>
                  <span className="text-xs text-fg-dim">
                    #{member.sort_order}
                  </span>
                  <form action={removeMemberAction}>
                    <input type="hidden" name="member_id" value={member.id} />
                    <IconSubmitButton title={`Remove ${member.full_name}`}>
                      <TrashIcon className="size-4" />
                    </IconSubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="section-title text-xl sm:text-2xl">Your posts</h2>

        {posts.length === 0 ? (
          <p className="mt-4 text-sm text-fg-dim">
            Nothing in the community yet.{" "}
            <Link href="/community" className="text-brand underline underline-offset-4">
              Write something
            </Link>
            .
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="card flex flex-wrap items-center gap-3 p-4"
              >
                <span className="chip border-accent/25 text-accent">
                  {CATEGORY_LABELS[post.category]}
                </span>
                <div className="min-w-50 flex-1">
                  <Link
                    href={`/community/${post.id}`}
                    className="font-medium hover:text-brand"
                  >
                    {post.title}
                  </Link>
                  <p className="text-xs text-fg-dim">
                    {timeAgo(post.created_at)}
                  </p>
                </div>
                <span className="chip">
                  <HeartIcon className="size-3.5" />
                  {countOf(post.likes)}
                </span>
                <span className="chip">
                  <MessageIcon className="size-3.5" />
                  {countOf(post.comments)}
                </span>
                <form action={deletePostAction}>
                  <input type="hidden" name="post_id" value={post.id} />
                  <IconSubmitButton title="Delete this post">
                    <TrashIcon className="size-4" />
                  </IconSubmitButton>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="section-title text-xl sm:text-2xl">Team profile</h2>
        <div className="card mt-5 p-6 sm:p-8">
          <TeamProfileForm team={team} />
        </div>
      </section>
    </div>
  );
}
