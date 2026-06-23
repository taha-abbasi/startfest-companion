import {
  type Session,
  CONFERENCE,
  sessionStart,
  sessionEnd,
  speakerLine,
  ROOMS,
} from "@/data/schedule";

// ─────────────────────────────────────────────────────────────────────────────
// iCalendar (.ics) generation.
//
// Each event carries a 30-minute alarm (VALARM). When an attendee adds a session
// to their phone's calendar, the device fires a local notification before it
// starts — this is our reliable "phone reminder" with zero SMS dependency.
// Times are emitted in UTC ("Z") to avoid VTIMEZONE ambiguity across clients.
// ─────────────────────────────────────────────────────────────────────────────

function fmt(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Fold/escape text per RFC 5545. */
function esc(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function vevent(s: Session, baseUrl: string): string[] {
  const room = ROOMS[s.room]?.label ?? "";
  const speakers = speakerLine(s);
  const descParts = [
    speakers ? `Speaker(s): ${speakers}` : "",
    s.note ? s.note : "",
    `Track: ${s.track}`,
    `Part of ${CONFERENCE.name} ${CONFERENCE.edition} — ${CONFERENCE.org}.`,
    baseUrl ? `Details & live attendance: ${baseUrl}` : "",
  ].filter(Boolean);

  const lines = [
    "BEGIN:VEVENT",
    `UID:${s.id}@startfest-companion`,
    `DTSTAMP:${fmt(new Date(0))}`,
    `DTSTART:${fmt(sessionStart(s))}`,
    `DTEND:${fmt(sessionEnd(s))}`,
    `SUMMARY:${esc(s.title)}`,
    `LOCATION:${esc(`${room} · ${CONFERENCE.venue}`)}`,
    `DESCRIPTION:${esc(descParts.join("\n"))}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(`${s.title} starts in 30 minutes`)}`,
    "TRIGGER:-PT30M",
    "END:VALARM",
    "END:VEVENT",
  ];
  return lines;
}

export function buildIcs(sessions: Session[], baseUrl = ""): string {
  const body = sessions.flatMap((s) => vevent(s, baseUrl));
  const cal = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Koolas//StartFest Companion//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(`${CONFERENCE.name} ${CONFERENCE.edition}`)}`,
    `X-WR-TIMEZONE:${CONFERENCE.tz}`,
    ...body,
    "END:VCALENDAR",
  ];
  // RFC 5545 requires CRLF line endings.
  return cal.join("\r\n") + "\r\n";
}

export function icsFilename(s?: Session): string {
  if (s) return `startfest-${s.id}.ics`;
  return "startfest-my-agenda.ics";
}
