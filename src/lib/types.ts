/** The FIRST programme a team competes in. */
export type Program = "ftc" | "fll";

/** Who an event is for. "all" means both programmes are welcome. */
export type EventAudience = "ftc" | "fll" | "all";

export type EventFormat = "in_person" | "online" | "hybrid";

export type EventKind =
  | "competition"
  | "scrimmage"
  | "workshop"
  | "outreach"
  | "meetup"
  | "other";

export type PostCategory =
  | "general"
  | "help"
  | "showcase"
  | "announcement"
  | "looking_for";

export interface TeamSummary {
  id: string;
  program: Program;
  team_number: number;
  name: string;
  city: string | null;
  logo_url: string | null;
}

/**
 * FIRST reuses numbers between programmes, so a team is identified by both.
 * Every link to a profile goes through here.
 */
export function teamHref(team: {
  program: Program;
  team_number: number;
}): string {
  return `/teams/${team.program}/${team.team_number}`;
}

export interface Team extends TeamSummary {
  country: string | null;
  // program and team_number come from TeamSummary
  organization: string | null;
  about: string | null;
  website: string | null;
  instagram: string | null;
  contact_email: string | null;
  rookie_year: number | null;
  /** Set per team in SQL. Undefined until the curated-events migration
      has run, which reads as "cannot host" - the safe default. */
  can_host_events?: boolean;
  /** Whoever registered the team. They start as its captain. */
  created_by?: string | null;
  created_at: string;
}

/**
 * Whether a team may put an event on the hub.
 *
 * The calendar is curated for now, so this is false for every team until
 * `can_host_events` is set on its row:
 *
 *   update public.teams set can_host_events = true where team_number = 38157;
 */
export function canHostEvents(
  team: { can_host_events?: boolean } | null | undefined,
): boolean {
  return team?.can_host_events === true;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  team_id: string | null;
  name: string;
  round_1: number | null;
  round_2: number | null;
  round_3: number | null;
  created_at: string;
}

/** The Robot Game counts a team's best round, not the sum. */
export function bestRound(participant: EventParticipant): number | null {
  const rounds = [
    participant.round_1,
    participant.round_2,
    participant.round_3,
  ].filter((score): score is number => typeof score === "number");

  return rounds.length > 0 ? Math.max(...rounds) : null;
}

export interface OutreachEntry {
  id: string;
  team_id: string;
  happened_on: string;
  title: string;
  description: string | null;
  people_reached: number | null;
  hours: number | null;
  link: string | null;
  created_at: string;
}

/** A person. One account is one person now, not one team. */
export interface Profile {
  id: string;
  full_name: string;
  created_at: string;
}

export type TeamRole = "captain" | "member";

/**
 * Someone on a team. This is both the public roster and the permission: the
 * people listed here are the people who can act for the team.
 */
export interface TeamMember {
  team_id: string;
  profile_id: string;
  role: TeamRole;
  /** Free text shown on the roster - "Programmer", "Driver", "Mentor". */
  title: string | null;
  sort_order: number;
  joined_at: string;
  profile?: Profile | null;
}

export type InviteStatus = "pending" | "accepted" | "declined";

export interface TeamInvite {
  id: string;
  team_id: string;
  email: string;
  invited_by: string | null;
  status: InviteStatus;
  created_at: string;
  team?: TeamSummary | null;
}

/** Someone trusted to enter robot game scores at one event. */
export interface EventScorekeeper {
  event_id: string;
  profile_id: string;
  created_at: string;
  profile?: Profile | null;
}

export interface EventRow {
  id: string;
  team_id: string;
  title: string;
  summary: string | null;
  description: string | null;
  city: string;
  country: string;
  venue: string | null;
  format: EventFormat;
  kind: EventKind;
  audience: EventAudience;
  starts_at: string;
  ends_at: string | null;
  registration_url: string | null;
  cover_url: string | null;
  capacity: number | null;
  cost: string | null;
  created_at: string;
}

export type AggregateCount = { count: number }[] | { count: number } | null;

export interface EventWithTeam extends EventRow {
  team: TeamSummary | null;
  likes: AggregateCount;
  feedback: AggregateCount;
  attendance: AggregateCount;
}

export interface EventFeedback {
  id: string;
  event_id: string;
  team_id: string;
  rating: number | null;
  body: string;
  created_at: string;
  team: TeamSummary | null;
}

export interface PostRow {
  id: string;
  team_id: string;
  title: string;
  body: string;
  category: PostCategory;
  created_at: string;
}

export interface PostWithTeam extends PostRow {
  team: TeamSummary | null;
  likes: AggregateCount;
  comments: AggregateCount;
}

export interface PostComment {
  id: string;
  post_id: string;
  team_id: string;
  body: string;
  created_at: string;
  team: TeamSummary | null;
}

/** PostgREST returns embedded aggregates as `[{ count: n }]`. */
export function countOf(value: AggregateCount | undefined): number {
  if (!value) return 0;
  if (Array.isArray(value)) return value[0]?.count ?? 0;
  return value.count ?? 0;
}

export const PROGRAMS: Program[] = ["ftc", "fll"];

export const EVENT_AUDIENCES: EventAudience[] = ["all", "ftc", "fll"];

export const PROGRAM_LABELS: Record<Program, string> = {
  ftc: "FTC",
  fll: "FLL",
};

export const PROGRAM_FULL_NAMES: Record<Program, string> = {
  ftc: "FIRST Tech Challenge",
  fll: "FIRST LEGO League",
};

export const AUDIENCE_LABELS: Record<EventAudience, string> = {
  all: "FTC and FLL",
  ftc: "FTC only",
  fll: "FLL only",
};

export const EVENT_FORMATS: EventFormat[] = ["in_person", "online", "hybrid"];

export const EVENT_KINDS: EventKind[] = [
  "competition",
  "scrimmage",
  "workshop",
  "outreach",
  "meetup",
  "other",
];

export const POST_CATEGORIES: PostCategory[] = [
  "general",
  "help",
  "showcase",
  "announcement",
  "looking_for",
];

export const FORMAT_LABELS: Record<EventFormat, string> = {
  in_person: "In person",
  online: "Online",
  hybrid: "Hybrid",
};

export const KIND_LABELS: Record<EventKind, string> = {
  competition: "Competition",
  scrimmage: "Scrimmage",
  workshop: "Workshop",
  outreach: "Outreach",
  meetup: "Meetup",
  other: "Other",
};

export const CATEGORY_LABELS: Record<PostCategory, string> = {
  general: "General",
  help: "Help wanted",
  showcase: "Showcase",
  announcement: "Announcement",
  looking_for: "Looking for",
};

export const CATEGORY_HINTS: Record<PostCategory, string> = {
  general: "Anything that does not fit the other boxes",
  help: "Stuck on code, CAD, hardware or a judging rubric",
  showcase: "Show the hub what your team built",
  announcement: "News from your team worth sharing",
  looking_for: "Looking for mentors, parts, a venue or an alliance partner",
};

export function isProgram(value: unknown): value is Program {
  return typeof value === "string" && PROGRAMS.includes(value as Program);
}

export function isEventAudience(value: unknown): value is EventAudience {
  return (
    typeof value === "string" &&
    EVENT_AUDIENCES.includes(value as EventAudience)
  );
}

export function isEventFormat(value: unknown): value is EventFormat {
  return typeof value === "string" && EVENT_FORMATS.includes(value as EventFormat);
}

export function isEventKind(value: unknown): value is EventKind {
  return typeof value === "string" && EVENT_KINDS.includes(value as EventKind);
}

export function isPostCategory(value: unknown): value is PostCategory {
  return (
    typeof value === "string" && POST_CATEGORIES.includes(value as PostCategory)
  );
}
