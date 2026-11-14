import { type EventParticipant, bestRound } from "@/lib/types";

import { TrophyIcon } from "./icons";

/** Teams with a score first, by best round; the rest keep their own order. */
export function rankParticipants(
  participants: EventParticipant[],
): EventParticipant[] {
  return [...participants].sort((a, b) => {
    const left = bestRound(a);
    const right = bestRound(b);

    if (left === null && right === null) return a.name.localeCompare(b.name);
    if (left === null) return 1;
    if (right === null) return -1;
    if (left !== right) return right - left;

    return a.name.localeCompare(b.name);
  });
}

const MEDALS = ["text-warn", "text-fg-muted", "text-brand-mid"];

export function Leaderboard({
  participants,
}: {
  participants: EventParticipant[];
}) {
  const ranked = rankParticipants(participants);
  const anyScores = ranked.some((entry) => bestRound(entry) !== null);

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[30rem] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs tracking-wider text-fg-dim uppercase">
            <th className="w-12 px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Team</th>
            <th className="w-16 px-2 py-3 text-right font-medium">R1</th>
            <th className="w-16 px-2 py-3 text-right font-medium">R2</th>
            <th className="w-16 px-2 py-3 text-right font-medium">R3</th>
            <th className="w-20 px-4 py-3 text-right font-medium">Best</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((entry, index) => {
            const best = bestRound(entry);
            const place = best === null ? null : index + 1;

            return (
              <tr
                key={entry.id}
                className="border-b border-line/60 last:border-0"
              >
                <td className="px-4 py-3">
                  {place === null ? (
                    <span className="text-fg-dim">—</span>
                  ) : place <= 3 && anyScores ? (
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${MEDALS[place - 1]}`}
                    >
                      <TrophyIcon className="size-3.5" />
                      {place}
                    </span>
                  ) : (
                    <span className="text-fg-muted">{place}</span>
                  )}
                </td>

                <td className="px-4 py-3 font-medium">{entry.name}</td>

                {[entry.round_1, entry.round_2, entry.round_3].map(
                  (score, round) => (
                    <td
                      key={round}
                      className="px-2 py-3 text-right tabular-nums text-fg-muted"
                    >
                      {score ?? "—"}
                    </td>
                  ),
                )}

                <td className="px-4 py-3 text-right font-semibold tabular-nums">
                  {best ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
