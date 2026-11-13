/**
 * Builds an iCalendar file for a single event, per RFC 5545.
 *
 * Written by hand rather than pulled from a package: the format is small, and
 * the three things that actually break calendar imports - escaping, UTC
 * stamps and line folding - are all handled here.
 */

const DEFAULT_LENGTH_MS = 2 * 60 * 60 * 1000;

/** Commas, semicolons, backslashes and newlines are structural in iCalendar. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** 20260314T093000Z - always UTC, so no VTIMEZONE block is needed. */
function toUtcStamp(value: Date): string {
  return `${value.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

/**
 * Content lines are limited to 75 octets; longer ones continue on the next
 * line starting with a space. Folding counts bytes, not characters, or a
 * Cyrillic venue name would push a line over the limit unnoticed.
 */
function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(line);
  if (bytes.length <= 75) return line;

  const parts: string[] = [];
  let current = "";
  let currentBytes = 0;
  // Continuation lines carry a leading space, so they hold one byte less.
  let limit = 75;

  for (const character of line) {
    const size = encoder.encode(character).length;
    if (currentBytes + size > limit) {
      parts.push(current);
      current = "";
      currentBytes = 0;
      limit = 74;
    }
    current += character;
    currentBytes += size;
  }

  if (current) parts.push(current);

  return parts.join("\r\n ");
}

export type IcsEvent = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  url?: string | null;
  startsAt: string;
  endsAt?: string | null;
  organiser?: string | null;
};

export function buildEventIcs(event: IcsEvent): string {
  const start = new Date(event.startsAt);
  const end = event.endsAt
    ? new Date(event.endsAt)
    : new Date(start.getTime() + DEFAULT_LENGTH_MS);

  const description = [event.description, event.organiser && `Hosted by ${event.organiser}`, event.url]
    .filter(Boolean)
    .join("\n\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Momentum Hub//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@momentum-hub`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(start)}`,
    `DTEND:${toUtcStamp(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
  ];

  if (description) lines.push(`DESCRIPTION:${escapeText(description)}`);
  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
  if (event.url) lines.push(`URL:${escapeText(event.url)}`);

  lines.push("END:VEVENT", "END:VCALENDAR");

  // iCalendar wants CRLF line endings, and a trailing one.
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}

/** A safe, recognisable download name: momentum-almaty-scrimmage.ics */
export function icsFileName(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

  return `momentum-${slug || "event"}.ics`;
}
