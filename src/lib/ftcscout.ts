/**
 * The official competition record, from FTCScout.
 *
 * The hub knows what teams tell it. FTCScout knows what actually happened at
 * events - rankings, win-loss records, awards, OPR - and keeps it current
 * without anybody here typing it in. For a team that is the most convincing
 * thing on its page, and it is the one thing a hub this size cannot produce
 * on its own.
 *
 * FTC only: FLL has no equivalent, and a team number means something
 * different there, so an FLL number must never be looked up here.
 *
 * The API asks not to be hammered - "please do not abuse the API or we may
 * have to add rate limiting" - so every call is cached for six hours and a
 * failure is always silent. A team profile that works is worth more than one
 * that shows an error because somebody else's service is down.
 */

const BASE = "https://api.ftcscout.org/rest/v1";
const REVALIDATE = 60 * 60 * 6;

/** Seasons are the year the game launched. 2026 is BioBuzz. */
export const FTC_SEASON = 2026;

export const FTCSCOUT_TEAM_URL = (number: number) =>
  `https://ftcscout.org/teams/${number}`;

export interface FtcTeam {
  number: number;
  name: string;
  schoolName: string | null;
  sponsors: string[];
  country: string | null;
  state: string | null;
  city: string | null;
  rookieYear: number | null;
  website: string | null;
}

type Measure = { value: number; rank: number };

export interface FtcQuickStats {
  season: number;
  number: number;
  /** Total, auto, driver-controlled and endgame OPR, with world rank. */
  tot: Measure;
  auto: Measure;
  dc: Measure;
  eg: Measure;
  /** How many teams the rank is out of. */
  count: number;
}

export interface FtcEventStats {
  rank: number | null;
  wins: number;
  losses: number;
  ties: number;
  qualMatchesPlayed: number;
}

export interface FtcEvent {
  eventCode: string;
  name: string | null;
  stats: FtcEventStats | null;
}

export interface FtcAward {
  eventCode: string;
  type: string;
  placement: number | null;
  personName: string | null;
}

export interface FtcRecord {
  team: FtcTeam | null;
  stats: FtcQuickStats | null;
  events: FtcEvent[];
  awards: FtcAward[];
}

async function get<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${BASE}${path}`, {
      next: { revalidate: REVALIDATE },
    });

    // A team with no stats answers 404 with a sentence of plain text, which
    // is a perfectly good "nothing here" and not worth a thrown error.
    if (!response.ok) return null;

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/** Event codes are not readable - FTCCMP1LOVE is a division at Worlds. */
async function eventName(
  season: number,
  code: string,
): Promise<string | null> {
  const event = await get<{ name?: string }>(`/events/${season}/${code}`);
  return event?.name ?? null;
}

/**
 * Everything worth showing for one team in one season.
 *
 * Each piece is fetched on its own and a missing one is simply absent, so a
 * team that has played no matches still gets its school and rookie year, and
 * one whose awards fail to load still gets its rankings.
 */
export async function loadFtcRecord(
  teamNumber: number,
  season: number = FTC_SEASON,
): Promise<FtcRecord> {
  const [team, stats, participations, awards] = await Promise.all([
    get<FtcTeam>(`/teams/${teamNumber}`),
    get<FtcQuickStats>(`/teams/${teamNumber}/quick-stats?season=${season}`),
    get<{ eventCode: string; stats: FtcEventStats | null }[]>(
      `/teams/${teamNumber}/events/${season}`,
    ),
    get<FtcAward[]>(`/teams/${teamNumber}/awards?season=${season}`),
  ]);

  // Names cost a call each, so only the most recent handful get one. The rest
  // keep their code, which still links somewhere useful.
  const recent = (participations ?? []).slice(-8);
  const names = await Promise.all(
    recent.map((row) => eventName(season, row.eventCode)),
  );

  return {
    team,
    stats,
    events: recent.map((row, index) => ({
      eventCode: row.eventCode,
      name: names[index],
      stats: row.stats,
    })),
    awards: awards ?? [],
  };
}

/** "DeansListFinalist" is how the API spells it; people do not. */
export function awardLabel(award: FtcAward): string {
  const spaced = award.type.replace(/([a-z])([A-Z])/g, "$1 $2");

  if (!award.placement) return spaced;

  const place =
    award.placement === 1
      ? "1st"
      : award.placement === 2
        ? "2nd"
        : award.placement === 3
          ? "3rd"
          : `${award.placement}th`;

  return `${spaced} - ${place}`;
}

/** "7-2-1", the way a team would say it out loud. */
export function recordLine(stats: FtcEventStats | null): string | null {
  if (!stats) return null;
  return `${stats.wins}-${stats.losses}-${stats.ties}`;
}
