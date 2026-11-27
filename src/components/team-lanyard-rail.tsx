"use client";

import { useState } from "react";

import { TeamAvatar } from "./team-avatar";

export interface LanyardPerson {
  id: string;
  name: string;
  /** "Captain", "Programmer", "Driver" - whatever the team calls them. */
  role: string | null;
  photoUrl: string | null;
  bio: string | null;
  isCaptain: boolean;
}

/**
 * Badges on lanyards at each team's own angle, so a hall of fourteen reads
 * as people rather than as a table. Hanging at the same angle would read as
 * a pattern, which is the opposite of the point.
 */
const HANG = [-4, 3, -2.5, 5, -3.5, 2, -5, 4, -1.5, 3.5, -3, 2.5, -4.5, 1.5];

function strapTone(index: number): string {
  // Two strap colours alternating down the rail, so neighbours differ.
  return index % 2 === 0
    ? "from-brand via-brand-mid to-brand-deep"
    : "from-brand-deep via-brand to-brand-mid";
}

function Badge({
  person,
  index,
  flipped,
  onFlip,
}: {
  person: LanyardPerson;
  index: number;
  flipped: boolean;
  onFlip: () => void;
}) {
  const tilt = HANG[index % HANG.length];
  const hasBack = Boolean(person.bio);

  return (
    <li className="shrink-0 pt-2">
      <div
        className="group lanyard-hang"
        style={{ "--hang": `${tilt}deg` } as React.CSSProperties}
      >
        {/* The strap. Narrows into the clip, which the card hangs off. */}
        <div className="relative mx-auto h-16 w-full max-w-[72px]">
          <div
            className={`mx-auto h-full w-6 bg-gradient-to-b ${strapTone(index)} opacity-80`}
            style={{ clipPath: "polygon(22% 0, 78% 0, 62% 100%, 38% 100%)" }}
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto h-3 w-8 rounded-sm border border-line bg-panel-2" />
        </div>

        <button
          type="button"
          onClick={onFlip}
          aria-pressed={flipped}
          aria-label={
            hasBack
              ? `${person.name}, ${flipped ? "hide" : "read"} their note`
              : person.name
          }
          disabled={!hasBack}
          className="lanyard-card block w-[164px] text-left focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none disabled:cursor-default sm:w-[180px]"
          style={{ perspective: "900px" }}
        >
          <span
            className="lanyard-face relative block transition-transform duration-500"
            style={{
              transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "none",
            }}
          >
            {/* Front */}
            <span
              className="card flex aspect-[3/4] flex-col items-center justify-center gap-3 p-4 text-center"
              style={{ backfaceVisibility: "hidden" }}
            >
              <TeamAvatar
                name={person.name}
                logoUrl={person.photoUrl}
                size="md"
              />
              <span className="block min-w-0">
                <span className="block truncate text-sm font-medium">
                  {person.name}
                </span>
                <span className="mt-0.5 block truncate text-xs text-fg-dim">
                  {person.isCaptain ? "Captain" : person.role || "Team member"}
                </span>
              </span>
              {hasBack ? (
                <span className="text-[10px] tracking-wider text-fg-dim uppercase">
                  Tap to read
                </span>
              ) : null}
            </span>

            {/* Back */}
            <span
              className="card absolute inset-0 flex aspect-[3/4] flex-col justify-center p-4"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <span className="block text-xs font-medium text-brand-soft">
                {person.name}
              </span>
              <span className="mt-2 block text-xs leading-relaxed text-fg-muted">
                {person.bio}
              </span>
            </span>
          </span>
        </button>
      </div>
    </li>
  );
}

export function TeamLanyardRail({ people }: { people: LanyardPerson[] }) {
  const [flipped, setFlipped] = useState<string | null>(null);

  if (people.length === 0) return null;

  return (
    <ul className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:flex-wrap sm:justify-start sm:overflow-visible sm:px-0">
      {people.map((person, index) => (
        <Badge
          key={person.id}
          person={person}
          index={index}
          flipped={flipped === person.id}
          onFlip={() =>
            setFlipped((current) => (current === person.id ? null : person.id))
          }
        />
      ))}
    </ul>
  );
}
