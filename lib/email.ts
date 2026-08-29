import { Resend } from "resend";
import {
  type Session,
  formatTimeRange,
  speakerLine,
  ROOMS,
  CONFERENCE,
  DAYS,
  dayLong,
} from "@/data/schedule";
import { BRAND } from "@/lib/brand";

// ─────────────────────────────────────────────────────────────────────────────
// Transactional email via Resend.
//  • Confirmation email on signup (with .ics attachment that carries an alarm)
//  • "Good morning" daily digest of an attendee's picks for the day
// Every email is CAN-SPAM compliant: physical-sender identity, reason for
// receipt, and a working one-click unsubscribe link.
// ─────────────────────────────────────────────────────────────────────────────

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || "StartFest <startfest@tahaabbasi.com>";
const REPLY_TO = process.env.EMAIL_REPLY_TO || undefined;

const C = {
  navy: "#0a2461",
  navy2: "#0e2f87",
  ink: "#0b1f4d",
  lime: "#c6f23e",
  limeDeep: "#a9d62b",
  slate: "#5b6b8c",
  border: "#e4e9f5",
  bg: "#f5f7fc",
};

function layout(opts: { preheader: string; heading: string; body: string; unsubUrl: string }): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${C.ink};">
<span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden">${opts.preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 40px -16px rgba(10,36,97,0.35);">
  <tr><td style="background:linear-gradient(135deg,${C.navy} 0%,${C.navy2} 60%,#16708a 100%);padding:26px 28px;">
    <div style="color:${C.lime};font-weight:800;letter-spacing:.14em;font-size:12px;text-transform:uppercase;">Silicon Slopes</div>
    <div style="color:#fff;font-weight:800;font-size:24px;line-height:1.1;margin-top:4px;">StartFest <span style="color:${C.lime};">2026</span></div>
    <div style="color:#bcd0ff;font-size:12px;margin-top:6px;">${dayLong(DAYS[0].date)}–${DAYS[1].date.slice(-2)} · ${CONFERENCE.venue}</div>
  </td></tr>
  <tr><td style="padding:28px 28px 8px;">
    <h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:${C.ink};">${opts.heading}</h1>
    ${opts.body}
  </td></tr>
  <tr><td style="padding:8px 28px 24px;">
    <!-- Lead-gen: Powered by AskFlorence -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;border:1px solid ${C.border};border-radius:14px;background:#fbfcff;">
      <tr><td style="padding:16px 18px;">
        <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${C.slate};font-weight:700;">Powered by ${BRAND.sponsorName}</div>
        <div style="font-size:14px;color:${C.ink};margin:6px 0 12px;">${BRAND.sponsorTagline}</div>
        <a href="${BRAND.sponsorUrl}" style="display:inline-block;background:${C.ink};color:#fff;text-decoration:none;font-weight:700;font-size:13px;padding:9px 16px;border-radius:9px;">${BRAND.sponsorCta} →</a>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:18px 28px 26px;border-top:1px solid ${C.border};">
    <div style="font-size:12px;color:${C.slate};line-height:1.6;">
      You're receiving this because you added a session to your schedule on the StartFest Companion.<br>
      ${BRAND.appName} · An app by ${BRAND.builder} (${BRAND.builderAlias}).<br>
      <a href="${opts.unsubUrl}" style="color:${C.slate};text-decoration:underline;">Unsubscribe from all StartFest email</a>
    </div>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function sessionRow(s: Session): string {
  const room = ROOMS[s.room]?.label ?? "";
  const speakers = speakerLine(s);
  const track = TRACK_HEX(s.track);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0;border:1px solid ${C.border};border-left:4px solid ${track};border-radius:12px;">
    <tr><td style="padding:14px 16px;">
      <div style="font-size:12px;color:${C.slate};font-weight:600;">${formatTimeRange(s)} · ${room}</div>
      <div style="font-size:16px;font-weight:700;color:${C.ink};margin:3px 0;">${escapeHtml(s.title)}</div>
      ${speakers ? `<div style="font-size:13px;color:${C.slate};">${escapeHtml(speakers)}</div>` : ""}
    </td></tr>
  </table>`;
}

function TRACK_HEX(track: string): string {
  const map: Record<string, string> = {
    ai: "#9bbd1f", marketing: "#0fa493", operations: "#2f93cf",
    funding: "#7059e6", leadership: "#a64fd6", sales: "#d83f87",
    resource: "#e07d3e", mainstage: "#d9a400",
  };
  return map[track] || C.navy2;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export interface SendResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

/** Passwordless sign-in / restore-profile link. */
export async function sendSignInEmail(args: {
  to: string;
  name: string;
  signInUrl: string;
  unsubUrl: string;
}): Promise<SendResult> {
  if (!resend) return { ok: true, skipped: true };
  const { to, name, signInUrl, unsubUrl } = args;
  const firstName = (name || "there").split(/\s+/)[0];
  const body = `
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Hi ${escapeHtml(firstName)} — tap below to sign back in to your StartFest schedule on this device. Your saved sessions, photo and links all come right back. 🤠</p>
    <div style="margin:18px 0 6px;">
      <a href="${signInUrl}" style="display:inline-block;background:${C.lime};color:${C.ink};text-decoration:none;font-weight:800;font-size:15px;padding:12px 22px;border-radius:10px;">Sign in to StartFest →</a>
    </div>
    <p style="margin:16px 0 0;font-size:13px;color:${C.slate};line-height:1.6;">This link is just for you. If you didn't request it, you can safely ignore this email.</p>
  `;
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      replyTo: REPLY_TO,
      subject: "Your StartFest sign-in link",
      html: layout({ preheader: "Sign back in to your StartFest schedule", heading: "Welcome back 👋", body, unsubUrl }),
    });
    if (error) return { ok: false, error: String((error as { message?: string }).message ?? error) };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Confirmation email when an attendee adds a session. */
export async function sendConfirmationEmail(args: {
  to: string;
  name: string;
  session: Session;
  manageUrl: string;
  unsubUrl: string;
  ics: string;
}): Promise<SendResult> {
  if (!resend) return { ok: true, skipped: true };
  const { to, name, session, manageUrl, unsubUrl, ics } = args;
  const firstName = (name || "there").split(/\s+/)[0];

  const body = `
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Hi ${escapeHtml(firstName)}, you're on the list for this session. We saved the calendar invite below — open the attachment to get a reminder on your phone 30 minutes before it starts. 📅</p>
    ${sessionRow(session)}
    <div style="margin:18px 0 6px;">
      <a href="${manageUrl}" style="display:inline-block;background:${C.lime};color:${C.ink};text-decoration:none;font-weight:800;font-size:14px;padding:11px 20px;border-radius:10px;">View &amp; manage my schedule</a>
    </div>
    <p style="margin:14px 0 0;font-size:13px;color:${C.slate};line-height:1.6;">Plans change — you can update or cancel anytime from the link above. See who else is going and watch the live headcount on the app.</p>
  `;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      replyTo: REPLY_TO,
      subject: `You're going: ${session.title} — StartFest`,
      html: layout({
        preheader: `${formatTimeRange(session)} · ${ROOMS[session.room]?.label ?? ""}`,
        heading: "You're on the list 🎉",
        body,
        unsubUrl,
      }),
      attachments: [
        {
          filename: `startfest-${session.id}.ics`,
          content: Buffer.from(ics).toString("base64"),
        },
      ],
      headers: { "List-Unsubscribe": `<${unsubUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    });
    if (error) return { ok: false, error: String((error as { message?: string }).message ?? error) };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Morning-of digest: everything this attendee picked for the given day. */
export async function sendDailyDigest(args: {
  to: string;
  name: string;
  dayLabel: string;
  sessions: Session[];
  conflictIds: Set<string>;
  manageUrl: string;
  unsubUrl: string;
  ics: string;
}): Promise<SendResult> {
  if (!resend) return { ok: true, skipped: true };
  const { to, name, dayLabel, sessions, conflictIds, manageUrl, unsubUrl, ics } = args;
  if (sessions.length === 0) return { ok: true, skipped: true };
  const firstName = (name || "there").split(/\s+/)[0];

  const rows = sessions
    .map((s) => {
      const base = sessionRow(s);
      if (conflictIds.has(s.id)) {
        return base.replace(
          "</table>",
          `<tr><td style="padding:0 16px 12px;"><span style="font-size:12px;color:#b00046;font-weight:700;">⚠ Overlaps another session you picked</span></td></tr></table>`
        );
      }
      return base;
    })
    .join("");

  const conflictNote = conflictIds.size
    ? `<p style="margin:0 0 14px;font-size:13px;color:#b00046;line-height:1.6;">Heads up — a couple of your picks overlap. Tap “manage my schedule” to choose between them.</p>`
    : "";

  const body = `
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Good morning ${escapeHtml(firstName)} — here's your ${escapeHtml(dayLabel)} at StartFest. The attached calendar has all of it with reminders built in.</p>
    ${conflictNote}
    ${rows}
    <div style="margin:18px 0 6px;">
      <a href="${manageUrl}" style="display:inline-block;background:${C.lime};color:${C.ink};text-decoration:none;font-weight:800;font-size:14px;padding:11px 20px;border-radius:10px;">Manage my schedule</a>
    </div>
  `;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      replyTo: REPLY_TO,
      subject: `Your StartFest ${dayLabel} — ${sessions.length} session${sessions.length === 1 ? "" : "s"}`,
      html: layout({
        preheader: `${sessions.length} sessions on your schedule today`,
        heading: `Your ${dayLabel} 🗓️`,
        body,
        unsubUrl,
      }),
      attachments: [{ filename: "startfest-today.ics", content: Buffer.from(ics).toString("base64") }],
      headers: { "List-Unsubscribe": `<${unsubUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    });
    if (error) return { ok: false, error: String((error as { message?: string }).message ?? error) };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
