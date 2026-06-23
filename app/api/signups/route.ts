import { NextResponse } from "next/server";
import { attendees, signups, ensureIndexes } from "@/lib/db";
import { getIdentityEmail } from "@/lib/identity";
import { getSession, SIGNUPABLE_IDS } from "@/data/schedule";
import { getBaseUrl } from "@/lib/baseUrl";
import { makeManageToken, makeUnsubToken } from "@/lib/identity";
import { buildIcs } from "@/lib/ics";
import { sendConfirmationEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const email = getIdentityEmail();
  if (!email) return NextResponse.json({ error: "identify_required" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const sessionId = String(body.sessionId ?? "");
  const session = getSession(sessionId);
  if (!session || !SIGNUPABLE_IDS.has(sessionId)) {
    return NextResponse.json({ error: "Unknown session." }, { status: 404 });
  }

  await ensureIndexes();
  const att = await (await attendees()).findOne({ email });
  if (!att) return NextResponse.json({ error: "identify_required" }, { status: 401 });

  const sCol = await signups();
  const now = new Date();

  const existing = await sCol.findOne({ sessionId, email });
  let created = false;
  if (!existing) {
    await sCol.insertOne({
      sessionId,
      email,
      name: att.name,
      showPublicly: att.showPublicly,
      createdAt: now,
      confirmationSentAt: null,
      lastDigestDate: null,
    });
    created = true;
  }

  const count = await sCol.countDocuments({ sessionId });

  // Send confirmation (best-effort, only on first signup and if opted in).
  let emailStatus: "sent" | "skipped" | "failed" = "skipped";
  if (created && att.emailOptIn && !att.unsubscribedAt) {
    const base = getBaseUrl();
    const ics = buildIcs([session], base);
    const result = await sendConfirmationEmail({
      to: email,
      name: att.name,
      session,
      manageUrl: `${base}/api/manage?t=${encodeURIComponent(makeManageToken(email))}`,
      unsubUrl: `${base}/api/unsubscribe?t=${encodeURIComponent(makeUnsubToken(email))}`,
      ics,
    });
    emailStatus = result.ok ? (result.skipped ? "skipped" : "sent") : "failed";
    if (result.ok && !result.skipped) {
      await sCol.updateOne({ sessionId, email }, { $set: { confirmationSentAt: new Date() } });
    } else if (!result.ok) {
      console.error("[signups] confirmation email failed:", result.error);
    }
  }

  return NextResponse.json({ ok: true, sessionId, count, created, emailStatus });
}
