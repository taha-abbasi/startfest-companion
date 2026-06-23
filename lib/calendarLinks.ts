import {
  type Session,
  sessionStart,
  sessionEnd,
  speakerLine,
  ROOMS,
  CONFERENCE,
} from "@/data/schedule";

// ─────────────────────────────────────────────────────────────────────────────
// "Add to calendar" deep links for the major providers (Calendly-style).
// Pure functions — safe to import in client components.
// ─────────────────────────────────────────────────────────────────────────────

/** Compact UTC: 20260623T163000Z */
function utc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
/** ISO with Z: 2026-06-23T16:30:00Z */
function iso(d: Date): string {
  return d.toISOString().replace(/\.\d{3}/, "");
}

export interface EventMeta {
  title: string;
  details: string;
  location: string;
  start: Date;
  end: Date;
}

export function sessionMeta(s: Session, origin = ""): EventMeta {
  const room = ROOMS[s.room]?.label ?? "";
  const speakers = speakerLine(s);
  const details = [
    speakers ? `Speaker(s): ${speakers}` : "",
    s.note || "",
    `Part of ${CONFERENCE.name} ${CONFERENCE.edition} — ${CONFERENCE.org}.`,
    origin ? `Details & live attendance: ${origin}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return {
    title: s.title,
    details,
    location: `${room} · ${CONFERENCE.venue}`,
    start: sessionStart(s),
    end: sessionEnd(s),
  };
}

export function googleEventUrl(m: EventMeta): string {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: m.title,
    dates: `${utc(m.start)}/${utc(m.end)}`,
    details: m.details,
    location: m.location,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export function outlookEventUrl(m: EventMeta, host = "outlook.live.com"): string {
  const p = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: m.title,
    startdt: iso(m.start),
    enddt: iso(m.end),
    body: m.details,
    location: m.location,
  });
  return `https://${host}/calendar/0/deeplink/compose?${p.toString()}`;
}

export const office365EventUrl = (m: EventMeta) => outlookEventUrl(m, "outlook.office.com");

export function yahooEventUrl(m: EventMeta): string {
  const p = new URLSearchParams({
    v: "60",
    title: m.title,
    st: utc(m.start),
    et: utc(m.end),
    desc: m.details,
    in_loc: m.location,
  });
  return `https://calendar.yahoo.com/?${p.toString()}`;
}

export const icsSessionPath = (s: Session) => `/api/ics/session/${encodeURIComponent(s.id)}`;

// ── Live subscription feed (auto-updates as picks change) ────────────────────

export interface SubscribeLinks {
  /** https URL of the personal feed */
  httpsFeed: string;
  /** webcal:// URL (Apple Calendar / generic subscribe) */
  webcal: string;
  /** Google Calendar "add by URL" subscription */
  google: string;
  /** one-time download of the full agenda */
  icsDownload: string;
}

export function subscribeLinks(origin: string, feedToken: string | null): SubscribeLinks {
  const q = feedToken ? `?t=${encodeURIComponent(feedToken)}` : "";
  const httpsFeed = `${origin}/api/ics/me${q}`;
  const webcal = httpsFeed.replace(/^https?:/i, "webcal:");
  const google = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`;
  return { httpsFeed, webcal, google, icsDownload: httpsFeed };
}
