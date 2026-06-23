import { NextResponse } from "next/server";
import { attendees, signups } from "@/lib/db";
import {
  SESSIONS,
  DAYS,
  getSession,
  findConflicts,
  sessionStart,
  CONFERENCE,
  type Session,
} from "@/data/schedule";
import { buildIcs } from "@/lib/ics";
import { sendDailyDigest } from "@/lib/email";
import { getBaseUrl } from "@/lib/baseUrl";
import { makeManageToken, makeUnsubToken } from "@/lib/identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function todayInDenver(): string {
  // en-CA yields YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: CONFERENCE.tz }).format(new Date());
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const target = url.searchParams.get("date") || todayInDenver();
  const dayMeta = DAYS.find((d) => d.date === target);
  if (!dayMeta) {
    return NextResponse.json({ ok: true, skipped: "not_a_conference_day", target });
  }
  const dayLabel = `${dayMeta.label} · ${dayMeta.weekday}`;

  const daySessionIds = new Set(
    SESSIONS.filter((s) => s.date === target && s.kind !== "break").map((s) => s.id)
  );

  // Map email -> their picked sessionIds for this day.
  const docs = await (await signups())
    .find({ sessionId: { $in: [...daySessionIds] } })
    .project({ email: 1, sessionId: 1, _id: 0 })
    .toArray();

  const byEmail = new Map<string, string[]>();
  for (const d of docs) {
    const row = d as { email: string; sessionId: string };
    const arr = byEmail.get(row.email) ?? [];
    arr.push(row.sessionId);
    byEmail.set(row.email, arr);
  }

  const base = getBaseUrl();
  const aCol = await attendees();
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const [email, ids] of byEmail) {
    const att = await aCol.findOne({ email });
    if (!att || !att.emailOptIn || att.unsubscribedAt) {
      skipped++;
      continue;
    }
    if (att.lastDigestDate === target) {
      skipped++; // already sent today — idempotent
      continue;
    }

    const sessions = ids
      .map((id) => getSession(id))
      .filter((s): s is Session => !!s)
      .sort((a, b) => sessionStart(a).getTime() - sessionStart(b).getTime());

    const conflictIds = new Set(findConflicts(ids).flat());
    const ics = buildIcs(sessions, base);

    const result = await sendDailyDigest({
      to: email,
      name: att.name,
      dayLabel,
      sessions,
      conflictIds,
      manageUrl: `${base}/api/manage?t=${encodeURIComponent(makeManageToken(email))}`,
      unsubUrl: `${base}/api/unsubscribe?t=${encodeURIComponent(makeUnsubToken(email))}`,
      ics,
    });

    if (result.ok && !result.skipped) {
      sent++;
      await aCol.updateOne({ email }, { $set: { lastDigestDate: target } });
    } else if (result.skipped) {
      skipped++;
    } else {
      failed++;
      console.error("[digest] failed for", email, result.error);
    }
  }

  return NextResponse.json({ ok: true, target, dayLabel, recipients: byEmail.size, sent, skipped, failed });
}
