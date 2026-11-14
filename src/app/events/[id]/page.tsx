import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { InfoNote } from "@/components/alert";
import { FeedbackForm } from "@/components/feedback-form";
import {
  ArrowUpRightIcon,
  CalendarIcon,
  ClockIcon,
  GlobeIcon,
  MapPinIcon,
  MessageIcon,
  PencilIcon,
  TicketIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/icons";
import { EventLikeButton } from "@/components/like-buttons";
import { SetupNotice } from "@/components/setup-notice";
import { StarRating } from "@/components/star-rating";
import { IconSubmitButton } from "@/components/submit-button";
import { TeamAvatar } from "@/components/team-avatar";
import { headers } from "next/headers";

import { AttendanceButton } from "@/components/attendance-button";
import { AttendanceEditor } from "@/components/attendance-editor";
import { EventQr } from "@/components/event-qr";
import { Leaderboard } from "@/components/leaderboard";
import { ScoreboardEditor } from "@/components/scoreboard-editor";
import { Scorekeepers } from "@/components/scorekeepers";
import { TeamTag } from "@/components/team-tag";
import { deleteEventAction, deleteFeedbackAction } from "@/lib/actions/events";
import { getCurrentMembership, getCurrentProfile } from "@/lib/auth";
import {
  countdown,
  externalHref,
  formatEventWhen,
  isPast,
  prettyHostname,
  timeAgo,
} from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  type EventFeedback,
  FORMAT_LABELS,
  KIND_LABELS,
  countOf,
  AUDIENCE_LABELS,
  type EventAudience,
  type EventAttendance,
  type EventParticipant,
  type EventScorekeeper,
  PROGRAM_LABELS,
  type Program,
  attendeeName,
  teamHref,
} from "@/lib/types";

const DETAIL_SELECT = [
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
  "team:teams!events_team_id_fkey(id, program, team_number, name, city, country, logo_url, about, website, instagram, contact_email)",
  "likes:event_likes(count)",
].join(", ");

type HostTeam = {
  id: string;
  program: Program;
  team_number: number;
  name: string;
  city: string | null;
  country: string | null;
  logo_url: string | null;
  about: string | null;
  website: string | null;
  instagram: string | null;
  contact_email: string | null;
};

type EventDetail = {
  id: string;
  team_id: string;
  title: string;
  summary: string | null;
  description: string | null;
  city: string;
  country: string;
  venue: string | null;
  format: keyof typeof FORMAT_LABELS;
  kind: keyof typeof KIND_LABELS;
  audience: EventAudience;
  starts_at: string;
  ends_at: string | null;
  registration_url: string | null;
  cover_url: string | null;
  capacity: number | null;
  cost: string | null;
  created_at: string;
  team: HostTeam | null;
  likes: { count: number }[];
};

async function loadEvent(id: string): Promise<EventDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select(DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();

  return (data as unknown as EventDetail | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  if (!isSupabaseConfigured) return { title: "Event" };

  const { id } = await params;
  const event = await loadEvent(id);

  if (!event) return { title: "Event not found" };

  return {
    title: event.title,
    description:
      event.summary ??
      `${KIND_LABELS[event.kind]} in ${event.city || "online"}, hosted by team ${event.team?.team_number ?? ""}.`,
  };
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-fg-dim">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs tracking-wider text-fg-dim uppercase">{label}</p>
        <p className="mt-0.5 text-sm break-words">{children}</p>
      </div>
    </div>
  );
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured) {
    return (
      <div className="px-4 py-16 sm:px-6">
        <SetupNotice />
      </div>
    );
  }

  const { id } = await params;
  const event = await loadEvent(id);

  if (!event) notFound();

  const supabase = await createClient();
  const [
    { data: feedbackData },
    { data: attendanceData },
    { data: participantData },
    { data: scorekeeperData },
    membership,
  ] = await Promise.all([
      supabase
        .from("event_feedback")
        .select(
          "id, event_id, team_id, rating, body, created_at, team:teams(id, program, team_number, name, city, logo_url)",
        )
        .eq("event_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("event_attendance")
        .select(
          "id, event_id, team_id, name, created_at, team:teams(id, program, team_number, name, city, logo_url)",
        )
        .eq("event_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("event_participants")
        .select(
          "id, event_id, team_id, name, round_1, round_2, round_3, created_at",
        )
        .eq("event_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("event_scorekeepers")
        .select(
          "event_id, profile_id, created_at, profile:profiles(id, full_name, created_at)",
        )
        .eq("event_id", id),
      getCurrentMembership(),
    ]);

  const participants = (participantData ??
    []) as unknown as EventParticipant[];

  const team = membership?.team ?? null;
  const scorekeepers = (scorekeeperData ??
    []) as unknown as EventScorekeeper[];

  const attendance = (attendanceData ?? []) as unknown as EventAttendance[];
  const goingCount = attendance.length;
  const weAreGoing = team
    ? attendance.some((row) => row.team_id === team.id)
    : false;

  const feedback = (feedbackData ?? []) as unknown as EventFeedback[];
  const myFeedback = team
    ? feedback.find((entry) => entry.team_id === team.id)
    : undefined;

  const ratings = feedback
    .map((entry) => entry.rating)
    .filter((rating): rating is number => typeof rating === "number");
  const averageRating =
    ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : null;

  // `host` further down is the team hosting the event, not the server.
  const requestHeaders = await headers();
  const requestHost = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHost.startsWith("localhost") ? "http" : "https";
  const eventUrl = `${protocol}://${requestHost}/events/${event.id}`;

  const isOwner = team?.id === event.team_id;
  const isHostCaptain = isOwner && membership?.role === "captain";

  // The captain of the hosting team, plus whoever they appointed. Scores
  // come off the field, so this is usually a referee rather than the team.
  const profile = await getCurrentProfile();
  const mayScore =
    isHostCaptain ||
    (profile
      ? scorekeepers.some((keeper) => keeper.profile_id === profile.id)
      : false);
  const past = isPast(event.starts_at);

  const liked = team
    ? Boolean(
        (
          await supabase
            .from("event_likes")
            .select("event_id")
            .eq("event_id", id)
            .eq("team_id", team.id)
            .maybeSingle()
        ).data,
      )
    : false;

  const host = event.team;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/events"
        className="text-sm text-fg-muted transition-colors hover:text-fg"
      >
        &larr; All events
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {event.cover_url ? (
            <img
              src={event.cover_url}
              alt=""
              className="mb-7 aspect-[16/6] w-full rounded-2xl border border-line object-cover"
            />
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <span className="chip border-brand/30 text-brand-soft">
              {KIND_LABELS[event.kind]}
            </span>
            <span className="chip">{FORMAT_LABELS[event.format]}</span>
            <span className="chip chip-active">
              {AUDIENCE_LABELS[event.audience]}
            </span>
            <span className={`chip ${past ? "" : "border-success/30 text-success"}`}>
              {countdown(event.starts_at)}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">
            {event.title}
          </h1>

          {event.summary ? (
            <p className="mt-3 text-lg text-fg-muted">{event.summary}</p>
          ) : null}

          <div className="card mt-7 grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <InfoRow icon={<CalendarIcon className="size-4.5" />} label="When">
              {formatEventWhen(event.starts_at, event.ends_at)}
            </InfoRow>

            <InfoRow
              icon={
                event.format === "online" ? (
                  <GlobeIcon className="size-4.5" />
                ) : (
                  <MapPinIcon className="size-4.5" />
                )
              }
              label="Where"
            >
              {event.format === "online"
                ? (event.venue ?? "Online")
                : [event.venue, event.city, event.country]
                    .filter(Boolean)
                    .join(", ")}
            </InfoRow>

            {event.capacity ? (
              <InfoRow icon={<UsersIcon className="size-4.5" />} label="Spots">
                {event.capacity} teams
              </InfoRow>
            ) : null}

            {event.cost ? (
              <InfoRow icon={<TicketIcon className="size-4.5" />} label="Cost">
                {event.cost}
              </InfoRow>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {event.registration_url ? (
              <a
                href={externalHref(event.registration_url)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
              >
                Register for this event
                <ArrowUpRightIcon className="size-4" />
              </a>
            ) : null}

            <AttendanceButton
              eventId={event.id}
              going={weAreGoing}
              count={goingCount}
              canRespond={Boolean(team)}
              signedIn={Boolean(profile)}
              capacity={event.capacity}
              past={past}
            />

            {/* A plain link, not a Link: this hits a route handler that
                returns a file rather than a page to navigate to. */}
            <a
              href={`/events/${event.id}/calendar.ics`}
              className="btn btn-outline"
            >
              <CalendarIcon className="size-4" />
              Add to calendar
            </a>
          </div>

          {event.description ? (
            <div className="mt-10">
              <h2 className="text-lg font-semibold">About this event</h2>
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-fg-muted">
                {event.description}
              </p>
            </div>
          ) : null}

          {participants.length > 0 ? (
            <section className="mt-12">
              <h2 className="text-lg font-semibold">
                Robot game
                <span className="ml-2 text-sm font-normal text-fg-dim">
                  best round counts
                </span>
              </h2>
              <div className="mt-5">
                <Leaderboard participants={participants} />
              </div>
            </section>
          ) : null}

          {mayScore ? (
            <section className="mt-12">
              <h2 className="text-lg font-semibold">Scoreboard</h2>
              <p className="mt-1.5 text-sm text-fg-muted">
                Only the scorekeepers see this. Everyone else sees the table
                above.
              </p>
              <div className="card mt-5 p-5 sm:p-6">
                <ScoreboardEditor
                  eventId={event.id}
                  participants={participants}
                />
              </div>
            </section>
          ) : null}

          {isOwner ? (
            <section className="mt-12">
              <h2 className="text-lg font-semibold">Who came</h2>
              <p className="mt-1.5 text-sm text-fg-muted">
                Teams on the hub mark themselves down. Write in everybody
                else - they need no account for this.
              </p>
              <div className="card mt-5 p-5 sm:p-6">
                <AttendanceEditor
                  eventId={event.id}
                  attendance={attendance}
                />
              </div>
            </section>
          ) : null}

          <section className="mt-12">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">
                Feedback
                <span className="ml-2 text-sm font-normal text-fg-dim">
                  {feedback.length}
                </span>
              </h2>
              {averageRating !== null ? (
                <span className="flex items-center gap-2 text-sm text-fg-muted">
                  <StarRating value={Math.round(averageRating)} />
                  {averageRating.toFixed(1)} / 5
                </span>
              ) : null}
            </div>

            <div className="mt-5 space-y-4">
              {feedback.length === 0 ? (
                <InfoNote>
                  No feedback yet. If your team went, say how it was - it helps
                  the hosts and every team deciding whether to come next time.
                </InfoNote>
              ) : (
                feedback.map((entry) => (
                  <article key={entry.id} className="card p-5">
                    <div className="flex items-start gap-3">
                      <TeamAvatar
                        name={entry.team?.name ?? "?"}
                        logoUrl={entry.team?.logo_url}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-dim">
                          {entry.team ? (
                            <Link
                              href={teamHref(entry.team)}
                              className="font-medium text-fg-muted hover:text-fg"
                            >
                              <TeamTag team={entry.team} />
                            </Link>
                          ) : (
                            <span>Team removed</span>
                          )}
                          <span aria-hidden="true">·</span>
                          <span>{timeAgo(entry.created_at)}</span>
                          {entry.rating ? (
                            <StarRating value={entry.rating} />
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm whitespace-pre-line text-fg-muted">
                          {entry.body}
                        </p>
                      </div>

                      {team?.id === entry.team_id ? (
                        <form action={deleteFeedbackAction}>
                          <input
                            type="hidden"
                            name="feedback_id"
                            value={entry.id}
                          />
                          <input type="hidden" name="event_id" value={event.id} />
                          <IconSubmitButton title="Delete your feedback">
                            <TrashIcon className="size-4" />
                          </IconSubmitButton>
                        </form>
                      ) : null}
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="card mt-6 p-5 sm:p-6">
              {team ? (
                <>
                  <h3 className="mb-4 font-semibold">
                    {myFeedback ? "Edit your feedback" : "Leave feedback"}
                  </h3>
                  <FeedbackForm
                    eventId={event.id}
                    existingBody={myFeedback?.body}
                    existingRating={myFeedback?.rating ?? 0}
                  />
                </>
              ) : (
                <p className="text-sm text-fg-muted">
                  <Link
                    href={`/login?next=/events/${event.id}`}
                    className="text-brand-mid underline decoration-brand-mid/40 underline-offset-4"
                  >
                    Log in
                  </Link>{" "}
                  to leave feedback and like this event.
                </p>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <p className="text-xs tracking-wider text-fg-dim uppercase">
              {past ? "Who came" : "Who is coming"}
            </p>

            <p className="font-display mt-2 text-2xl font-semibold">
              {goingCount}
              {event.capacity ? (
                <span className="text-base font-normal text-fg-dim">
                  {" "}
                  of {event.capacity}
                </span>
              ) : null}
              <span className="ml-1.5 text-sm font-normal text-fg-muted">
                {goingCount === 1 ? "team" : "teams"}
              </span>
            </p>

            {attendance.length > 0 ? (
              <ul className="mt-4 space-y-2.5">
                {attendance.map((row) =>
                  row.team ? (
                    <li key={row.id}>
                      <Link
                        href={teamHref(row.team)}
                        className="flex items-center gap-2 text-fg-muted transition-colors hover:text-fg"
                      >
                        <TeamAvatar
                          name={row.team.name}
                          logoUrl={row.team.logo_url}
                          size="sm"
                        />
                        <TeamTag team={row.team} className="text-xs" />
                      </Link>
                    </li>
                  ) : (
                    <li
                      key={row.id}
                      className="flex items-center gap-2 text-fg-muted"
                    >
                      <TeamAvatar name={attendeeName(row)} size="sm" />
                      <span className="truncate text-xs">
                        {attendeeName(row)}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-fg-dim">
                {past
                  ? "No team marked itself down for this one."
                  : "Nobody yet. If your team is going, say so - it is what the host counts on when booking."}
              </p>
            )}
          </div>

          <div className="card p-5">
            <p className="text-xs tracking-wider text-fg-dim uppercase">
              Interest
            </p>
            <div className="mt-3 flex items-center gap-3">
              <EventLikeButton
                id={event.id}
                liked={liked}
                count={countOf(event.likes)}
                canLike={Boolean(team)}
                size="lg"
              />
              <span className="chip">
                <MessageIcon className="size-3.5" />
                {feedback.length}
              </span>
            </div>
            <p className="mt-3 text-xs text-fg-dim">
              Likes tell the hosts how many teams are interested.
            </p>
          </div>

          {host ? (
            <div className="card p-5">
              <p className="text-xs tracking-wider text-fg-dim uppercase">
                Hosted by
              </p>
              <div className="mt-3 flex items-center gap-3">
                <TeamAvatar name={host.name} logoUrl={host.logo_url} size="lg" />
                <div className="min-w-0">
                  <p className="font-display font-semibold">
                    {PROGRAM_LABELS[host.program]} #{host.team_number}
                  </p>
                  <p className="truncate text-sm text-fg-muted">{host.name}</p>
                  {host.city ? (
                    <p className="text-xs text-fg-dim">{host.city}</p>
                  ) : null}
                </div>
              </div>

              {host.about ? (
                <p className="mt-4 line-clamp-4 text-sm text-fg-muted">
                  {host.about}
                </p>
              ) : null}

              <div className="mt-4 space-y-2 text-sm">
                {host.website ? (
                  <a
                    href={externalHref(host.website)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-fg-muted hover:text-fg"
                  >
                    <GlobeIcon className="size-4" />
                    {prettyHostname(host.website)}
                  </a>
                ) : null}
              </div>

              <Link
                href={teamHref(host)}
                className="btn btn-outline mt-4 w-full"
              >
                View team profile
              </Link>
            </div>
          ) : null}

          {isHostCaptain ? (
            <div className="card p-5">
              <p className="text-xs tracking-wider text-fg-dim uppercase">
                Who keeps score
              </p>
              <div className="mt-4">
                <Scorekeepers
                  eventId={event.id}
                  scorekeepers={scorekeepers}
                />
              </div>
            </div>
          ) : null}

          {isOwner ? (
            <div className="card p-5">
              <p className="text-xs tracking-wider text-fg-dim uppercase">
                Bring teams in
              </p>
              <div className="mt-4">
                <EventQr
                  url={eventUrl}
                  label="Put this on a slide or print it. Scanning opens this page, where a team can register and mark itself down."
                />
              </div>
            </div>
          ) : null}

          {isOwner ? (
            <div className="card p-5">
              <p className="text-xs tracking-wider text-fg-dim uppercase">
                Your event
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  href={`/events/${event.id}/edit`}
                  className="btn btn-outline w-full"
                >
                  <PencilIcon className="size-4" />
                  Edit
                </Link>
                <form action={deleteEventAction}>
                  <input type="hidden" name="event_id" value={event.id} />
                  <IconSubmitButton
                    className="btn btn-danger w-full"
                    title="Delete this event"
                  >
                    <TrashIcon className="size-4" />
                    Delete event
                  </IconSubmitButton>
                </form>
              </div>
            </div>
          ) : null}

          <div className="card p-5 text-xs text-fg-dim">
            <ClockIcon className="mb-2 size-4" />
            Posted {timeAgo(event.created_at)}. All times are Almaty time
            (UTC+5).
          </div>
        </aside>
      </div>
    </div>
  );
}
