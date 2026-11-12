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
import { deleteEventAction, deleteFeedbackAction } from "@/lib/actions/events";
import { getCurrentTeam } from "@/lib/auth";
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
  "starts_at",
  "ends_at",
  "registration_url",
  "capacity",
  "cost",
  "created_at",
  "team:teams(id, team_number, name, city, country, logo_url, about, website, instagram, contact_email)",
  "likes:event_likes(count)",
].join(", ");

type HostTeam = {
  id: string;
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
  starts_at: string;
  ends_at: string | null;
  registration_url: string | null;
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
  const [{ data: feedbackData }, team] = await Promise.all([
    supabase
      .from("event_feedback")
      .select(
        "id, event_id, team_id, rating, body, created_at, team:teams(id, team_number, name, city, logo_url)",
      )
      .eq("event_id", id)
      .order("created_at", { ascending: false }),
    getCurrentTeam(),
  ]);

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

  const isOwner = team?.id === event.team_id;
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
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip border-brand/30 text-brand-soft">
              {KIND_LABELS[event.kind]}
            </span>
            <span className="chip">{FORMAT_LABELS[event.format]}</span>
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

          {event.registration_url ? (
            <a
              href={externalHref(event.registration_url)}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary mt-5"
            >
              Register for this event
              <ArrowUpRightIcon className="size-4" />
            </a>
          ) : null}

          {event.description ? (
            <div className="mt-10">
              <h2 className="text-lg font-semibold">About this event</h2>
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-fg-muted">
                {event.description}
              </p>
            </div>
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
                              href={`/teams/${entry.team.team_number}`}
                              className="font-medium text-fg-muted hover:text-fg"
                            >
                              #{entry.team.team_number} {entry.team.name}
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
                    className="text-brand underline decoration-brand/40 underline-offset-4"
                  >
                    Log in with your team account
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
                    #{host.team_number}
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
                href={`/teams/${host.team_number}`}
                className="btn btn-outline mt-4 w-full"
              >
                View team profile
              </Link>
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
