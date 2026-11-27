import {
  FTCSCOUT_TEAM_URL,
  FTC_SEASON,
  awardLabel,
  loadFtcRecord,
  recordLine,
} from "@/lib/ftcscout";

import { ArrowUpRightIcon, SparkIcon, TrophyIcon } from "./icons";

function Stat({
  label,
  value,
  rank,
  count,
}: {
  label: string;
  value: number;
  rank: number;
  count: number;
}) {
  return (
    <div className="card p-4">
      <p className="text-xs tracking-wider text-fg-dim uppercase">{label}</p>
      <p className="font-display mt-1.5 text-2xl font-semibold">
        {value.toFixed(1)}
      </p>
      <p className="mt-1 text-xs text-fg-dim">
        #{rank.toLocaleString()} of {count.toLocaleString()}
      </p>
    </div>
  );
}

/**
 * What FIRST's own results say about a team.
 *
 * Rendered as its own async component so a slow or sleeping FTCScout delays
 * this block and nothing else on the page.
 */
export async function FtcRecord({ teamNumber }: { teamNumber: number }) {
  const { team, stats, events, awards } = await loadFtcRecord(teamNumber);

  // No entry at all usually means the number is not an FTC team, or it is
  // too new to be listed. Either way there is nothing honest to show.
  if (!team) return null;

  const played = events.filter((event) => event.stats);
  const nothingYet = !stats && played.length === 0 && awards.length === 0;

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="section-title flex items-center gap-2 text-xl sm:text-2xl">
          <SparkIcon className="size-5 text-fg-dim" />
          Official record
          <span className="text-sm font-normal text-fg-dim">{FTC_SEASON}</span>
        </h2>
        <a
          href={FTCSCOUT_TEAM_URL(teamNumber)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline btn-sm"
        >
          On FTCScout
          <ArrowUpRightIcon className="size-4" />
        </a>
      </div>

      {nothingYet ? (
        <p className="mt-4 text-sm text-fg-dim">
          No matches played this season yet.
          {team.rookieYear ? ` Rookie year ${team.rookieYear}.` : ""}
          {team.schoolName ? ` ${team.schoolName}.` : ""}
        </p>
      ) : null}

      {stats ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="OPR"
            value={stats.tot.value}
            rank={stats.tot.rank}
            count={stats.count}
          />
          <Stat
            label="Auto"
            value={stats.auto.value}
            rank={stats.auto.rank}
            count={stats.count}
          />
          <Stat
            label="TeleOp"
            value={stats.dc.value}
            rank={stats.dc.rank}
            count={stats.count}
          />
          <Stat
            label="Endgame"
            value={stats.eg.value}
            rank={stats.eg.rank}
            count={stats.count}
          />
        </div>
      ) : null}

      {played.length > 0 ? (
        <div className="mt-5 space-y-2">
          {played.map((event) => (
            <a
              key={event.eventCode}
              href={`https://ftcscout.org/events/${FTC_SEASON}/${event.eventCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="card flex flex-wrap items-center gap-x-4 gap-y-1 p-4 transition-colors hover:border-line-strong"
            >
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {event.name ?? event.eventCode}
              </span>
              {event.stats?.rank ? (
                <span className="chip">Rank {event.stats.rank}</span>
              ) : null}
              <span className="font-display text-sm font-semibold tabular-nums">
                {recordLine(event.stats)}
              </span>
            </a>
          ))}
        </div>
      ) : null}

      {awards.length > 0 ? (
        <ul className="mt-5 flex flex-wrap gap-2">
          {awards.map((award, index) => (
            <li
              key={`${award.eventCode}-${award.type}-${index}`}
              className="chip border-warn/30 text-warn"
            >
              <TrophyIcon className="size-3.5" />
              {awardLabel(award)}
              {award.personName ? ` · ${award.personName}` : ""}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-4 text-xs text-fg-dim">
        Rankings and results from{" "}
        <a
          href="https://ftcscout.org"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-line underline-offset-4 hover:text-fg"
        >
          FTCScout
        </a>
        , updated through the season. OPR is how many points a team adds to an
        alliance on average.
      </p>
    </section>
  );
}

/** Shown while FTCScout answers. */
export function FtcRecordSkeleton() {
  return (
    <section className="mt-12">
      <h2 className="section-title flex items-center gap-2 text-xl sm:text-2xl">
        <SparkIcon className="size-5 text-fg-dim" />
        Official record
      </h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="card h-24 animate-pulse p-4" />
        ))}
      </div>
    </section>
  );
}

/**
 * Who pays for the robot.
 *
 * FTCScout carries the sponsor list a team filed with FIRST, so this is one
 * more thing a team does not have to type in twice - and sponsor recognition
 * is something teams genuinely owe their backers.
 */
export async function FtcSponsors({ teamNumber }: { teamNumber: number }) {
  const { team } = await loadFtcRecord(teamNumber);

  if (!team || team.sponsors.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="section-title text-xl sm:text-2xl">Sponsors</h2>
      <ul className="mt-5 flex flex-wrap gap-2">
        {team.sponsors.map((sponsor) => (
          <li key={sponsor} className="chip">
            {sponsor}
          </li>
        ))}
      </ul>
    </section>
  );
}
