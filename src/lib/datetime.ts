import { SITE_TIMEZONE } from "./format";

const partsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: SITE_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function zoneParts(date: Date) {
  const parts = partsFormatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
    second: read("second"),
  };
}

/** How far the site timezone is ahead of UTC at a given instant, in ms. */
function zoneOffsetMs(date: Date): number {
  const p = zoneParts(date);
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asIfUtc - date.getTime();
}

/**
 * Turns the value of an `<input type="datetime-local">` (wall-clock time in the
 * site timezone) into a UTC ISO string for Postgres.
 */
export function localInputToIso(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    value.trim(),
  );
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;
  const wallClock = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second ?? "0"),
  );

  let instant = wallClock - zoneOffsetMs(new Date(wallClock));
  const refined = wallClock - zoneOffsetMs(new Date(instant));
  if (refined !== instant) instant = refined;

  const result = new Date(instant);
  return Number.isNaN(result.getTime()) ? null : result.toISOString();
}

/** The inverse: fills `<input type="datetime-local">` when editing. */
export function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const p = zoneParts(date);
  const pad = (n: number) => String(n).padStart(2, "0");

  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}
