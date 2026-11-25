import Link from "next/link";

import { type EventParticipant, bestRound } from "@/lib/types";

import { TrophyIcon } from "./icons";
import { rankParticipants } from "./leaderboard";

const PLACES = ["text-warn", "text-fg-muted", "text-brand-mid"];

/**
 * The top of a robot game board, for the home page.
 *
 * Between events the hub has nothing upcoming to show, and the most
 * interesting thing it holds is what happened at the last one. A result is
 * also the one thing here that is worth coming back to look at.
 */
export function Podium({
  eventId,
  eventTitle,
  participants,
}: {
  eventId: string;
  eventTitle: string;
  participants: EventParticipant[];
}) {
  const ranked = rankParticipants(participants)
    .filter((entry) => bestRound(entry) !== null)
    .slice(0, 3);

  if (ranked.length === 0) return null;

  return (
    <div className="card p-5 sm:p-6">
      <p className="eyebrow">Robot game</p>
      <h3 className="mt-2 text-lg font-semibold">
        <Link
          href={`/events/${eventId}`}
          className="transition-colors hover:text-brand-mid"
        >
          {eventTitle}
        </Link>
      </h3>

      <ol className="mt-5 space-y-3">
        {ranked.map((entry, index) => (
          <li key={entry.id} className="flex items-center gap-3 text-sm">
            <span
              className={`inline-flex items-center gap-1 font-semibold ${PLACES[index]}`}
            >
              <TrophyIcon className="size-3.5" />
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 truncate font-medium">
              {entry.name}
            </span>
            <span className="font-display font-semibold tabular-nums">
              {bestRound(entry)}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-5 text-xs text-fg-dim">
        Best of three rounds.{" "}
        <Link
          href={`/events/${eventId}`}
          className="text-brand-mid underline decoration-brand-mid/40 underline-offset-4"
        >
          Full board
        </Link>
      </p>
    </div>
  );
}
