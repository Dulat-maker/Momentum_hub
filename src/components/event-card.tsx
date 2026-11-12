import Link from "next/link";

import { calendarTile, countdown, formatTime, isPast } from "@/lib/format";
import { type EventWithTeam, KIND_LABELS, countOf } from "@/lib/types";

import { ClockIcon, GlobeIcon, MapPinIcon, MessageIcon } from "./icons";
import { EventLikeButton } from "./like-buttons";
import { TeamAvatar } from "./team-avatar";

export function EventCard({
  event,
  liked,
  canLike,
}: {
  event: EventWithTeam;
  liked: boolean;
  canLike: boolean;
}) {
  const tile = calendarTile(event.starts_at);
  const past = isPast(event.starts_at);
  const host = event.team;

  return (
    <article className="card card-link relative flex gap-4 p-5">
      <Link
        href={`/events/${event.id}`}
        className="absolute inset-0 rounded-2xl"
        aria-label={event.title}
      />

      <div
        className={`flex size-14 shrink-0 flex-col items-center justify-center rounded-xl border ${
          past
            ? "border-line bg-panel-2 text-fg-dim"
            : "border-brand/30 bg-brand/10 text-brand-mid"
        }`}
      >
        <span className="text-[10px] font-semibold tracking-wider">
          {tile.month}
        </span>
        <span className="font-display text-xl leading-none font-semibold">
          {tile.day}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base leading-snug font-semibold">{event.title}</h3>
          <span
            className={`chip shrink-0 ${
              past ? "" : "border-brand/30 text-brand-soft"
            }`}
          >
            {countdown(event.starts_at)}
          </span>
        </div>

        {event.summary ? (
          <p className="mt-1.5 line-clamp-2 text-sm text-fg-muted">
            {event.summary}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-fg-dim">
          <span className="inline-flex items-center gap-1.5">
            <ClockIcon className="size-3.5" />
            {formatTime(event.starts_at)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            {event.format === "online" ? (
              <GlobeIcon className="size-3.5" />
            ) : (
              <MapPinIcon className="size-3.5" />
            )}
            {event.format === "online" ? "Online" : event.city || "TBA"}
          </span>
          <span className="chip">{KIND_LABELS[event.kind]}</span>
        </div>

        <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
          {host ? (
            <Link
              href={`/teams/${host.team_number}`}
              className="flex min-w-0 items-center gap-2 text-xs text-fg-muted transition-colors hover:text-fg"
            >
              <TeamAvatar name={host.name} logoUrl={host.logo_url} size="sm" />
              <span className="truncate">
                <span className="text-fg-dim">#{host.team_number}</span>{" "}
                {host.name}
              </span>
            </Link>
          ) : (
            <span className="text-xs text-fg-dim">Host team removed</span>
          )}

          <div className="flex shrink-0 items-center gap-2">
            <span className="chip" title="Feedback left by teams">
              <MessageIcon className="size-3.5" />
              {countOf(event.feedback)}
            </span>
            <EventLikeButton
              id={event.id}
              liked={liked}
              count={countOf(event.likes)}
              canLike={canLike}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
