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
import { InviteCard } from "@/components/invite-card";
import { InviteForm } from "@/components/invite-form";
import { OutreachForm } from "@/components/outreach-form";
import { IconSubmitButton, SubmitButton } from "@/components/submit-button";
import { TeamAvatar } from "@/components/team-avatar";
import { TeamProfileForm } from "@/components/team-profile-form";
import { deletePostAction } from "@/lib/actions/community";
import { deleteEventAction } from "@/lib/actions/events";
import { removeOutreachAction } from "@/lib/actions/outreach";
import {
  cancelInviteAction,
  leaveTeamAction,
  removeMemberAction,
} from "@/lib/actions/teams";
import { getCurrentMembership, getCurrentUser, requireProfile } from "@/lib/auth";
import {
  calendarTile,
  externalHref,
  formatDate,
  formatEventWhen,
  prettyHostname,
  timeAgo,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import {
  type AggregateCount,
  canHostEvents,
  CATEGORY_LABELS,
  type OutreachEntry,
  type PostRow,
  type TeamInvite,
  type TeamMember,
  countOf,
  PROGRAM_LABELS,
  type Program,
  teamHref,
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

type GoingEvent = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  city: string | null;
  team: { program: Program; team_number: number; name: string } | null;
};

type GoingRow = { event_id: string; event: GoingEvent | null };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await requireProfile("/dashboard");
  const params = await searchParams;
  const membership = await getCurrentMembership();

  const supabase = await createClient();

  // Signed in but on no team. That is the normal state between creating an
  // account and either registering a team or taking up an invitation, so it
  // gets a page of its own rather than a redirect to one of the two.
  if (!membership) {
    const user = await getCurrentUser();
    const { data: inviteRows } = await supabase
      .from("team_invites")
      .select(
        "id, team_id, email, invited_by, status, created_at, team:teams(id, program, team_number, name, city, logo_url)",
      )
      .eq("status", "pending")
      .eq("email", (user?.email ?? "").toLowerCase())
      .order("created_at", { ascending: false });

    const invites = (inviteRows ?? []) as unknown as TeamInvite[];

    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="eyebrow">Hello, {profile.full_name}</p>
        <h1 className="mt-2 text-3xl font-semibold">
          You are not on a team yet
        </h1>
        <p className="mt-3 text-fg-muted">
          Your account is ready. What is left is the team - either register
          it, if you are the captain, or wait for your captain to invite the
          address you signed up with.
        </p>

        {invites.length > 0 ? (
          <section className="mt-9">
            <h2 className="section-title text-xl">Waiting for you</h2>
            <div className="mt-4 space-y-3">
              {invites.map((invite) => (
                <InviteCard key={invite.id} invite={invite} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-9">
          <h2 className="section-title text-xl">
            {invites.length > 0 ? "Or start your own" : "Register your team"}
          </h2>
          <p className="mt-2 text-sm text-fg-muted">
            One person does this for the whole team and becomes its captain.
            Everyone else joins by invitation.
          </p>
          <Link href="/teams/new" className="btn btn-primary mt-4">
            <PlusIcon className="size-4" />
            Register a team
          </Link>
        </section>
      </div>
    );
  }

  const team = membership.team;
  const isCaptain = membership.role === "captain";

  const [memberRes, eventRes, postRes, goingRes, outreachRes, inviteRes] =
    await Promise.all([
    supabase
      .from("team_members")
      .select(
        "team_id, profile_id, role, title, sort_order, joined_at, profile:profiles(id, full_name, created_at)",
      )
      .eq("team_id", team.id)
      .order("sort_order", { ascending: true }),
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
    supabase
      .from("event_attendance")
      .select(
        "event_id, event:events(id, title, starts_at, ends_at, city, team:teams!events_team_id_fkey(program, team_number, name))",
      )
      .eq("team_id", team.id),
    supabase
      .from("outreach_entries")
      .select(
        "id, team_id, happened_on, title, description, people_reached, hours, link, created_at",
      )
      .eq("team_id", team.id)
      .order("happened_on", { ascending: false }),
    supabase
      .from("team_invites")
      .select("id, team_id, email, invited_by, status, created_at")
      .eq("team_id", team.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  const members = (memberRes.data ?? []) as unknown as TeamMember[];
  const pendingInvites = (inviteRes.data ?? []) as unknown as TeamInvite[];
  const outreach = (outreachRes.data ?? []) as unknown as OutreachEntry[];

  const outreachHours = outreach.reduce(
    (total, entry) => total + (entry.hours ?? 0),
    0,
  );
  const outreachPeople = outreach.reduce(
    (total, entry) => total + (entry.people_reached ?? 0),
    0,
  );
  const events = (eventRes.data ?? []) as unknown as MyEvent[];
  const posts = (postRes.data ?? []) as unknown as MyPost[];

  // Only what is still ahead, soonest first - the past belongs on the event
  // pages, not on a to-do list.
  const now = new Date();
  const going = ((goingRes.data ?? []) as unknown as GoingRow[])
    .map((row) => row.event)
    .filter((event): event is GoingEvent => Boolean(event))
    .filter((event) => new Date(event.starts_at) >= now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));

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
              <span className="text-brand-mid">#</span>
              {team.team_number} {team.name}
              <span className="chip chip-active ml-2 align-middle">
                {PROGRAM_LABELS[team.program]}
              </span>
            </h1>
            <p className="mt-1 text-sm text-fg-muted">
              {[team.city, team.country].filter(Boolean).join(", ") ||
                "Add your city below"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={teamHref(team)}
            className="btn btn-outline btn-sm"
          >
            Public page
            <ArrowUpRightIcon className="size-4" />
          </Link>
          {canHostEvents(team) ? (
            <Link href="/events/new" className="btn btn-primary btn-sm">
              <PlusIcon className="size-4" />
              Add event
            </Link>
          ) : null}
        </div>
      </header>

      {params.deleted === "event" ? (
        <div className="mt-6">
          <SuccessAlert message="Event deleted." />
        </div>
      ) : null}

      {params.password === "updated" ? (
        <div className="mt-6">
          <SuccessAlert message="Password changed. Everyone on the team will need the new one." />
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
            {canHostEvents(team) ? (
              <>
                Nothing posted yet.{" "}
                <Link
                  href="/events/new"
                  className="text-brand-mid underline underline-offset-4"
                >
                  Add your first event
                </Link>
                .
              </>
            ) : (
              "Momentum is putting the events on the hub for now."
            )}
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
                      className="font-medium hover:text-brand-mid"
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
        <h2 className="section-title text-xl sm:text-2xl">Where you are going</h2>
        <p className="mt-2 text-sm text-fg-muted">
          Events your team marked itself down for. The hosts count on this when
          they book.
        </p>

        {going.length === 0 ? (
          <p className="mt-4 text-sm text-fg-dim">
            Nothing yet. Open an event and press &quot;Count us in&quot;.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {going.map((event) => {
              const tile = calendarTile(event.starts_at);
              return (
                <div
                  key={event.id}
                  className="card flex flex-wrap items-center gap-4 p-4"
                >
                  <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl border border-brand/30 bg-brand/10">
                    <span className="text-[10px] font-semibold text-brand-mid">
                      {tile.month}
                    </span>
                    <span className="font-display leading-none font-semibold">
                      {tile.day}
                    </span>
                  </div>

                  <div className="min-w-50 flex-1">
                    <Link
                      href={`/events/${event.id}`}
                      className="font-medium hover:text-brand-mid"
                    >
                      {event.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-fg-dim">
                      {formatEventWhen(event.starts_at, event.ends_at)}
                      {event.city ? ` · ${event.city}` : ""}
                      {event.team
                        ? ` · ${PROGRAM_LABELS[event.team.program]} #${event.team.team_number} ${event.team.name}`
                        : ""}
                    </p>
                  </div>

                  <Link
                    href={`/events/${event.id}`}
                    className="btn btn-ghost btn-sm"
                  >
                    Open
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="section-title text-xl sm:text-2xl">The team</h2>
        <p className="mt-2 text-sm text-fg-muted">
          Everyone here can post events and reply in the community as the team.
          They show on your public page too.
        </p>

        <div className="card mt-5 p-5">
          {isCaptain ? <InviteForm /> : null}

          {members.length > 0 ? (
            <ul
              className={`divide-y divide-line ${
                isCaptain ? "mt-6 border-t border-line" : ""
              }`}
            >
              {members.map((member) => (
                <li
                  key={member.profile_id}
                  className="flex items-center gap-3 py-3 text-sm"
                >
                  <TeamAvatar
                    name={member.profile?.full_name ?? "Someone"}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {member.profile?.full_name ?? "Someone"}
                      {member.profile_id === profile.id ? (
                        <span className="ml-2 text-xs font-normal text-fg-dim">
                          you
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-fg-dim">
                      {member.role === "captain"
                        ? "Captain"
                        : member.title || "Team member"}
                    </p>
                  </div>

                  {isCaptain && member.role !== "captain" ? (
                    <form action={removeMemberAction}>
                      <input
                        type="hidden"
                        name="profile_id"
                        value={member.profile_id}
                      />
                      <IconSubmitButton
                        title={`Remove ${member.profile?.full_name ?? "this member"}`}
                      >
                        <TrashIcon className="size-4" />
                      </IconSubmitButton>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}

          {isCaptain && pendingInvites.length > 0 ? (
            <div className="mt-6 border-t border-line pt-4">
              <p className="text-xs tracking-wider text-fg-dim uppercase">
                Invited, not joined yet
              </p>
              <ul className="mt-2 divide-y divide-line">
                {pendingInvites.map((invite) => (
                  <li
                    key={invite.id}
                    className="flex items-center gap-3 py-2.5 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate text-fg-muted">
                      {invite.email}
                    </span>
                    <form action={cancelInviteAction}>
                      <input
                        type="hidden"
                        name="invite_id"
                        value={invite.id}
                      />
                      <IconSubmitButton
                        title={`Withdraw the invitation to ${invite.email}`}
                      >
                        <TrashIcon className="size-4" />
                      </IconSubmitButton>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {!isCaptain ? (
            <form
              action={leaveTeamAction}
              className="mt-5 border-t border-line pt-4"
            >
              <SubmitButton
                className="btn btn-ghost btn-sm"
                pendingLabel="Leaving..."
              >
                Leave the team
              </SubmitButton>
            </form>
          ) : null}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="section-title text-xl sm:text-2xl">Outreach log</h2>
        <p className="mt-2 max-w-2xl text-sm text-fg-muted">
          What the team did for the community. It builds up through the season
          and shows on your public page, which is a page you can point a judge
          at.
        </p>

        {outreach.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-3">
            <span className="chip">
              {outreach.length}{" "}
              {outreach.length === 1 ? "activity" : "activities"}
            </span>
            {outreachHours > 0 ? (
              <span className="chip">{outreachHours} team hours</span>
            ) : null}
            {outreachPeople > 0 ? (
              <span className="chip">{outreachPeople} people reached</span>
            ) : null}
          </div>
        ) : null}

        <div className="card mt-5 p-5 sm:p-6">
          <OutreachForm today={new Date().toISOString().slice(0, 10)} />

          {outreach.length > 0 ? (
            <ul className="mt-6 divide-y divide-line border-t border-line">
              {outreach.map((entry) => (
                <li key={entry.id} className="flex items-start gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{entry.title}</p>
                    <p className="mt-0.5 text-xs text-fg-dim">
                      {formatDate(entry.happened_on)}
                      {entry.people_reached
                        ? ` · ${entry.people_reached} people`
                        : ""}
                      {entry.hours ? ` · ${entry.hours} h` : ""}
                    </p>
                    {entry.description ? (
                      <p className="mt-1.5 text-sm whitespace-pre-line text-fg-muted">
                        {entry.description}
                      </p>
                    ) : null}
                    {entry.link ? (
                      <a
                        href={externalHref(entry.link)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1.5 inline-block text-xs text-brand-mid underline decoration-brand-mid/40 underline-offset-4"
                      >
                        {prettyHostname(entry.link)}
                      </a>
                    ) : null}
                  </div>

                  <form action={removeOutreachAction}>
                    <input type="hidden" name="entry_id" value={entry.id} />
                    <IconSubmitButton title={`Remove ${entry.title}`}>
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
            <Link href="/community" className="text-brand-mid underline underline-offset-4">
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
                <span className="chip border-brand-mid/25 text-brand-soft">
                  {CATEGORY_LABELS[post.category]}
                </span>
                <div className="min-w-50 flex-1">
                  <Link
                    href={`/community/${post.id}`}
                    className="font-medium hover:text-brand-mid"
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
                <Link
                  href={`/community/${post.id}/edit`}
                  className="btn btn-ghost btn-sm"
                  title="Edit"
                >
                  <PencilIcon className="size-4" />
                </Link>
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
