/**
 * All dates are rendered in one fixed timezone so that the server-rendered
 * string never disagrees with the client. Change this if the hub moves.
 */
export const SITE_TIMEZONE = "Asia/Almaty";

const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: SITE_TIMEZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dayNoYearFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: SITE_TIMEZONE,
  day: "numeric",
  month: "short",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: SITE_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const weekdayFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: SITE_TIMEZONE,
  weekday: "short",
});

const monthShortFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: SITE_TIMEZONE,
  month: "short",
});

const dayNumberFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: SITE_TIMEZONE,
  day: "numeric",
});

const relativeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

export function formatDate(iso: string): string {
  return dayFormatter.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

export function formatWeekday(iso: string): string {
  return weekdayFormatter.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return `${dayFormatter.format(new Date(iso))}, ${timeFormatter.format(new Date(iso))}`;
}

/** "Mar" + "14" for the little calendar tile on event cards. */
export function calendarTile(iso: string): { month: string; day: string } {
  const date = new Date(iso);
  return {
    month: monthShortFormatter.format(date).toUpperCase(),
    day: dayNumberFormatter.format(date),
  };
}

export function formatEventWhen(startsAt: string, endsAt: string | null): string {
  const start = new Date(startsAt);
  const startText = `${formatWeekday(startsAt)}, ${dayFormatter.format(start)} - ${timeFormatter.format(start)}`;

  if (!endsAt) return startText;

  const end = new Date(endsAt);
  const sameDay = dayFormatter.format(start) === dayFormatter.format(end);

  if (sameDay) return `${startText} to ${timeFormatter.format(end)}`;

  return `${dayNoYearFormatter.format(start)} - ${dayFormatter.format(end)}`;
}

export function isPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

/** "3 days ago", "in 2 weeks" - computed on the server at render time. */
export function timeAgo(iso: string): string {
  const diffSeconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const absolute = Math.abs(diffSeconds);

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];

  for (const [unit, seconds] of units) {
    if (absolute >= seconds) {
      return relativeFormatter.format(Math.round(diffSeconds / seconds), unit);
    }
  }

  return "just now";
}

export function countdown(iso: string): string {
  const diffDays = Math.ceil(
    (new Date(iso).getTime() - Date.now()) / 86_400_000,
  );

  if (diffDays < 0) return "Finished";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `In ${diffDays} days`;
  if (diffDays < 30) return `In ${Math.round(diffDays / 7)} weeks`;
  return `In ${Math.round(diffDays / 30)} months`;
}

export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** Accepts "team.kz" or "https://team.kz" and always returns a usable href. */
export function externalHref(value: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function prettyHostname(value: string): string {
  try {
    return new URL(externalHref(value)).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}
