// ─────────────────────────────────────────────────────────────────────────────
// StartFest 2026 — official agenda data
// Silicon Slopes · June 23–24, 2026 · Mountain America Event Venue (Loveland
// Living Planet Aquarium). All times Mountain Daylight Time (MDT, UTC−06:00).
//
// Transcribed from the official StartFest agenda art. This file is the single
// source of truth for the app — edit here to correct any session details.
// ─────────────────────────────────────────────────────────────────────────────

export type TrackId =
  | "ai"
  | "marketing"
  | "operations"
  | "funding"
  | "leadership"
  | "sales"
  | "resource"
  | "mainstage";

export type RoomId =
  | "mainstage"
  | "start"
  | "ignition"
  | "accelerator"
  | "resource"
  | "hackathon";

export type SessionKind = "plenary" | "session" | "activity" | "break";

export interface Speaker {
  name: string;
  title?: string;
}

export interface Session {
  id: string;
  day: 1 | 2;
  /** ISO date in conference local time, e.g. "2026-06-23" */
  date: string;
  /** 24h local start "HH:MM" (MDT) */
  start: string;
  /** 24h local end "HH:MM" (MDT) */
  end: string;
  title: string;
  track: TrackId;
  room: RoomId;
  kind: SessionKind;
  speakers: Speaker[];
  /** Optional note shown subtly on the card. */
  note?: string;
}

export interface TrackMeta {
  id: TrackId;
  label: string;
  /** hex accent */
  color: string;
  /** "dark" => dark text reads on the accent; "light" => white text */
  ink: "dark" | "light";
  /** show in the public filter legend (mirrors the official flyer legend) */
  inLegend: boolean;
}

export const TRACKS: Record<TrackId, TrackMeta> = {
  ai: { id: "ai", label: "AI", color: "#c6f23e", ink: "dark", inLegend: true },
  marketing: { id: "marketing", label: "Marketing", color: "#19c9b6", ink: "dark", inLegend: true },
  operations: { id: "operations", label: "Operations", color: "#4fb8f0", ink: "dark", inLegend: true },
  funding: { id: "funding", label: "Funding", color: "#8b7bf0", ink: "light", inLegend: true },
  leadership: { id: "leadership", label: "Self Leadership", color: "#c06af0", ink: "light", inLegend: true },
  sales: { id: "sales", label: "Sales", color: "#ec5b9e", ink: "light", inLegend: true },
  resource: { id: "resource", label: "Resource", color: "#f59e6b", ink: "dark", inLegend: false },
  mainstage: { id: "mainstage", label: "Mainstage", color: "#ffce47", ink: "dark", inLegend: false },
};

export const ROOMS: Record<RoomId, { id: RoomId; label: string; letter?: string }> = {
  mainstage: { id: "mainstage", label: "Mainstage" },
  start: { id: "start", label: "Start Room", letter: "A" },
  ignition: { id: "ignition", label: "Ignition Room", letter: "B" },
  accelerator: { id: "accelerator", label: "Accelerator", letter: "C" },
  resource: { id: "resource", label: "Resource Room" },
  hackathon: { id: "hackathon", label: "Hackathon" },
};

export const CONFERENCE = {
  name: "StartFest",
  edition: "2026",
  org: "Silicon Slopes",
  venue: "Mountain America Event Venue · Loveland Living Planet Aquarium",
  city: "Salt Lake City, UT",
  tz: "America/Denver",
  /** Fixed UTC offset for the conference dates (MDT). */
  utcOffset: "-06:00",
};

export const DAYS = [
  { day: 1 as const, date: "2026-06-23", weekday: "Tuesday", label: "Day 1" },
  { day: 2 as const, date: "2026-06-24", weekday: "Wednesday", label: "Day 2" },
];

// ── Sessions ────────────────────────────────────────────────────────────────
export const SESSIONS: Session[] = [
  // ===== DAY 1 — Tuesday, June 23 =====
  {
    id: "welcome",
    day: 1, date: "2026-06-23", start: "09:00", end: "09:15",
    title: "Welcome", track: "mainstage", room: "mainstage", kind: "plenary",
    speakers: [{ name: "Clint Betts" }, { name: "Lindsey Ivie" }],
  },
  {
    id: "d1-keynote",
    day: 1, date: "2026-06-23", start: "09:15", end: "09:45",
    title: "Opening Keynote", track: "mainstage", room: "mainstage", kind: "plenary",
    speakers: [{ name: "Nick Thomas", title: "CEO Nordmark · Co-founded Bluetooth Special Interest Group" }],
  },
  {
    id: "d1-panel-money",
    day: 1, date: "2026-06-23", start: "09:45", end: "10:15",
    title: "The State of Silicon Slopes: Where the Money Is Moving",
    track: "mainstage", room: "mainstage", kind: "plenary",
    speakers: [
      { name: "Ryan Caldwell", title: "CEO, MX" },
      { name: "Tara Rosander", title: "Deputy Director, COO GOED" },
    ],
  },
  {
    id: "break-d1-1",
    day: 1, date: "2026-06-23", start: "11:05", end: "11:25",
    title: "Break", track: "mainstage", room: "mainstage", kind: "break", speakers: [],
  },
  {
    id: "bridging-the-gap",
    day: 1, date: "2026-06-23", start: "10:30", end: "11:05",
    title: "Bridging the Gap", track: "funding", room: "start", kind: "session",
    speakers: [{ name: "Scott Holley", title: "Executive Director, Lassonde Entrepreneur Institute" }],
  },
  {
    id: "you-cant-scale",
    day: 1, date: "2026-06-23", start: "10:30", end: "11:05",
    title: "You Can't Scale What You Can't Regulate", track: "leadership", room: "ignition", kind: "session",
    speakers: [{ name: "Lisa Jones Christensen", title: "Associate Professor of Entrepreneurship, Marriott School of Business, BYU" }],
  },
  {
    id: "ai-blueprint-workshop",
    day: 1, date: "2026-06-23", start: "10:30", end: "11:05",
    title: "AI Blueprint Workshop", track: "ai", room: "accelerator", kind: "session",
    speakers: [{ name: "Cameo Doran", title: "Founder, Cameo Labs" }],
  },
  {
    id: "surviving-the-ai-correction",
    day: 1, date: "2026-06-23", start: "10:30", end: "11:05",
    title: "Surviving the AI Correction", track: "ai", room: "start", kind: "session",
    speakers: [{ name: "Michael Malin", title: "Founder, Model Forge" }],
  },
  {
    id: "ai-not-your-cmo",
    day: 1, date: "2026-06-23", start: "11:25", end: "12:00",
    title: "AI Is Not Your CMO: The New GTM Math", track: "sales", room: "start", kind: "session",
    speakers: [{ name: "Joe Grover", title: "CGO, Ampleo" }],
  },
  {
    id: "funding-lendio",
    day: 1, date: "2026-06-23", start: "11:25", end: "12:00",
    title: "Funding", track: "funding", room: "ignition", kind: "session",
    speakers: [{ name: "Brock Blake", title: "CEO, Lendio" }],
  },
  {
    id: "even-achieving",
    day: 1, date: "2026-06-23", start: "11:25", end: "12:00",
    title: "Even-Achieving: How to Balance Stress with Success", track: "leadership", room: "accelerator", kind: "session",
    speakers: [{ name: "Erika Coleman", title: "Erika Coleman Speaks" }],
  },
  {
    id: "lunch-d1",
    day: 1, date: "2026-06-23", start: "12:00", end: "13:30",
    title: "Networking Lunch", track: "mainstage", room: "mainstage", kind: "break", speakers: [],
  },
  {
    id: "content-people-want",
    day: 1, date: "2026-06-23", start: "13:30", end: "14:05",
    title: "How to Make Content People Actually Want to Watch", track: "marketing", room: "start", kind: "session",
    speakers: [{ name: "Levi Lindsay", title: "VP of Creative, Pestie" }],
  },
  {
    id: "ai-for-c-suite",
    day: 1, date: "2026-06-23", start: "13:30", end: "14:05",
    title: "AI for the C-Suite", track: "ai", room: "ignition", kind: "session",
    speakers: [{ name: "Landon Essig", title: "CEO, CoDev" }],
  },
  {
    id: "advisory-board-fundraising",
    day: 1, date: "2026-06-23", start: "13:30", end: "14:05",
    title: "Build an Advisory Board to Strengthen Fundraising", track: "funding", room: "accelerator", kind: "session",
    speakers: [{ name: "Nicole Toomey Davis", title: "President & CEO and Co-Founder, Enclavix, LLC" }],
  },
  {
    id: "leadership-daly",
    day: 1, date: "2026-06-23", start: "14:15", end: "15:00",
    title: "Leadership", track: "leadership", room: "start", kind: "session",
    speakers: [{ name: "Steve Daly", title: "CEO, Instructure" }],
  },
  {
    id: "comp-plan-pipeline",
    day: 1, date: "2026-06-23", start: "14:15", end: "15:00",
    title: "Your Comp Plan Is Killing Your Pipeline", track: "sales", room: "ignition", kind: "session",
    speakers: [{ name: "Amy Cook", title: "CMO, Fullcast" }],
  },
  {
    id: "build-business-with-ai",
    day: 1, date: "2026-06-23", start: "14:15", end: "15:00",
    title: "How to Build a Business with AI", track: "ai", room: "accelerator", kind: "session",
    speakers: [{ name: "Jon Cheney", title: "CEO, GENAIPI" }],
  },
  {
    id: "leadership-arntz",
    day: 1, date: "2026-06-23", start: "15:15", end: "16:00",
    title: "Leadership", track: "leadership", room: "start", kind: "session",
    speakers: [{ name: "Steve Arntz", title: "CEO, Campfire" }],
  },
  {
    id: "hackathon",
    day: 1, date: "2026-06-23", start: "15:15", end: "17:00",
    title: "Hackathon", track: "ai", room: "hackathon", kind: "activity",
    speakers: [],
    note: "Build something live with fellow founders.",
  },

  // ===== DAY 2 — Wednesday, June 24 =====
  {
    id: "d2-keynote",
    day: 2, date: "2026-06-24", start: "08:45", end: "09:15",
    title: "AI and the Future of Utah", track: "mainstage", room: "mainstage", kind: "plenary",
    note: "Opening Keynote",
    speakers: [
      { name: "Jeremy Andrus", title: "CEO, Traeger" },
      { name: "Clint Betts", title: "CEO, Silicon Slopes" },
    ],
  },
  {
    id: "startup-world-cup",
    day: 2, date: "2026-06-24", start: "09:15", end: "10:50",
    title: "Startup World Cup — 10 Finalists", track: "mainstage", room: "mainstage", kind: "plenary",
    speakers: [],
  },
  {
    id: "chaos-to-process",
    day: 2, date: "2026-06-24", start: "11:00", end: "11:35",
    title: "From Chaos to Process", track: "operations", room: "start", kind: "session",
    speakers: [{ name: "Jake Fackrell", title: "COO, Savvos Health" }],
  },
  {
    id: "ai-automation",
    day: 2, date: "2026-06-24", start: "11:00", end: "11:35",
    title: "AI Automation", track: "ai", room: "ignition", kind: "session",
    speakers: [{ name: "Gabe Larsen", title: "Atonom" }],
  },
  {
    id: "ai-powered-growth-marketing",
    day: 2, date: "2026-06-24", start: "11:00", end: "11:35",
    title: "AI-Powered Growth Marketing", track: "sales", room: "accelerator", kind: "session",
    speakers: [{ name: "Michael Schmutz", title: "Founder, DataXGrowth" }],
  },
  {
    id: "room-owes-you-nothing",
    day: 2, date: "2026-06-24", start: "11:40", end: "12:15",
    title: "The Room Owes You Nothing: Leading Without a Resume", track: "leadership", room: "start", kind: "session",
    speakers: [
      { name: "Kurt Workman", title: "CEO, Owlet" },
      { name: "Clint Betts", title: "CEO, Silicon Slopes" },
    ],
  },
  {
    id: "unexpected-obvious-growth",
    day: 2, date: "2026-06-24", start: "11:40", end: "12:15",
    title: "The Unexpected Obvious of Growth: Conferences, Podcasts & Thought Leadership",
    track: "marketing", room: "ignition", kind: "session",
    speakers: [{ name: "Zack Oates", title: "Founder & CEO, Ovation" }],
  },
  {
    id: "event-marketing",
    day: 2, date: "2026-06-24", start: "11:40", end: "12:15",
    title: "Event Marketing", track: "marketing", room: "accelerator", kind: "session",
    speakers: [
      { name: "Catherine Bennett" },
      { name: "Hayden Harward" },
      { name: "Kolleen Russo", title: "Utah Business" },
    ],
  },
  {
    id: "lunch-d2",
    day: 2, date: "2026-06-24", start: "12:30", end: "14:00",
    title: "Networking Lunch", track: "mainstage", room: "mainstage", kind: "break", speakers: [],
  },
  {
    id: "stop-noise-build-signal",
    day: 2, date: "2026-06-24", start: "14:00", end: "14:35",
    title: "Stop Producing Noise. Start Building Signal", track: "marketing", room: "start", kind: "session",
    speakers: [{ name: "Krista Parry", title: "Founder, KP Media" }],
  },
  {
    id: "reliable-ai-pydantic-n8n",
    day: 2, date: "2026-06-24", start: "14:00", end: "14:35",
    title: "Building Reliable AI Workflow Automations with Pydantic & n8n", track: "ai", room: "ignition", kind: "session",
    speakers: [{ name: "Jordan Gunderson", title: "Co-Founder, Izeni" }],
  },
  {
    id: "teams-stop-talking",
    day: 2, date: "2026-06-24", start: "14:00", end: "14:35",
    title: "When Teams Stop Talking, Data Stops Working", track: "operations", room: "accelerator", kind: "session",
    speakers: [{ name: "Russ Hannig", title: "COO, SponsorCX" }],
  },
  {
    id: "sustainable-ai-data-centers",
    day: 2, date: "2026-06-24", start: "14:40", end: "15:40",
    title: "Sustainable AI and the Rise of the Mega Data Centers", track: "ai", room: "start", kind: "session",
    note: "Panel Discussion",
    speakers: [{ name: "Brian Beutler", title: "CEO, Alianza" }],
  },
  {
    id: "open-office-hours",
    day: 2, date: "2026-06-24", start: "14:40", end: "15:15",
    title: "Open Office Hours", track: "resource", room: "resource", kind: "session",
    note: "Resource partners in Marketing, Sales, Legal, Accounting, and Fund Raising.",
    speakers: [],
  },
  {
    id: "community-age-of-ai",
    day: 2, date: "2026-06-24", start: "14:40", end: "15:15",
    title: "Building Community in the Age of AI", track: "marketing", room: "accelerator", kind: "session",
    speakers: [{ name: "Sindee Savage", title: "Community Architech, Sindee Savage Consulting" }],
  },
  {
    id: "million-dollar-video-ad",
    day: 2, date: "2026-06-24", start: "15:20", end: "16:00",
    title: "The Million Dollar Video Ad Framework", track: "marketing", room: "ignition", kind: "session",
    speakers: [{ name: "Jake Larsen", title: "Founder, Video Power Marketing" }],
  },
  {
    id: "grinding-to-growing",
    day: 2, date: "2026-06-24", start: "15:20", end: "16:00",
    title: "From Grinding to Growing: Architect Your Capacity Wall", track: "leadership", room: "accelerator", kind: "session",
    speakers: [{ name: "Russ Simon", title: "Founder, Russ Simon Leadership Solutions" }],
  },
];

// ── Derived / helpers ─────────────────────────────────────────────────────────

const byId = new Map(SESSIONS.map((s) => [s.id, s]));

export function getSession(id: string): Session | undefined {
  return byId.get(id);
}

/** Set of session ids that exist — used to validate incoming signups. */
export const VALID_SESSION_IDS = new Set(SESSIONS.map((s) => s.id));

/** Sessions a user can actually sign up for (not plain breaks). */
export const SIGNUPABLE_IDS = new Set(
  SESSIONS.filter((s) => s.kind !== "break").map((s) => s.id)
);

/** Absolute start instant for a session, anchored to conference local time. */
export function sessionStart(s: Session): Date {
  return new Date(`${s.date}T${s.start}:00${CONFERENCE.utcOffset}`);
}

export function sessionEnd(s: Session): Date {
  return new Date(`${s.date}T${s.end}:00${CONFERENCE.utcOffset}`);
}

/** True when two sessions overlap in time (touching endpoints do NOT count). */
export function sessionsOverlap(a: Session, b: Session): boolean {
  return sessionStart(a) < sessionEnd(b) && sessionStart(b) < sessionEnd(a);
}

/** Among a set of selected ids, return the clusters that mutually conflict. */
export function findConflicts(selectedIds: string[]): Array<[string, string]> {
  const picked = selectedIds
    .map((id) => byId.get(id))
    .filter((s): s is Session => !!s && s.kind !== "break" && s.kind !== "plenary");
  const out: Array<[string, string]> = [];
  for (let i = 0; i < picked.length; i++) {
    for (let j = i + 1; j < picked.length; j++) {
      if (sessionsOverlap(picked[i], picked[j])) out.push([picked[i].id, picked[j].id]);
    }
  }
  return out;
}

const TIME_FMT = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: CONFERENCE.tz,
});

export function formatTimeRange(s: Session): string {
  return `${TIME_FMT.format(sessionStart(s))} – ${TIME_FMT.format(sessionEnd(s))}`;
}

export function formatStart(s: Session): string {
  return TIME_FMT.format(sessionStart(s));
}

export function speakerLine(s: Session): string {
  return s.speakers.map((sp) => sp.name).join(", ");
}
