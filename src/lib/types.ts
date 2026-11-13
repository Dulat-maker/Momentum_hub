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
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  full_name: string;
  role: string | null;
  grade: string | null;
  sort_order: number;
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
  capacity: number | null;
  cost: string | null;
  created_at: string;
}

export type AggregateCount = { count: number }[] | { count: number } | null;

export interface EventWithTeam extends EventRow {
  team: TeamSummary | null;
  likes: AggregateCount;
  feedback: AggregateCount;
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
