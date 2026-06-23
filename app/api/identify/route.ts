import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { attendees, signups, ensureIndexes, type AttendeeDoc } from "@/lib/db";
import {
  isValidEmail,
  normalizeEmail,
  makeIdentityToken,
  makeFeedToken,
  IDENTITY_COOKIE,
  IDENTITY_COOKIE_OPTS,
} from "@/lib/identity";
import { normalizePhone } from "@/lib/sms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const emailRaw = String(body.email ?? "").trim();
  const phoneRaw = body.phone ? String(body.phone).trim() : "";
  const emailOptIn = body.emailOptIn !== false; // default true
  const smsOptIn = body.smsOptIn === true;
  const showPublicly = body.showPublicly !== false; // default true

  if (name.length < 1 || name.length > 80) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!isValidEmail(emailRaw)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  const email = normalizeEmail(emailRaw);
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  if (phoneRaw && !phone) {
    return NextResponse.json({ error: "That phone number doesn't look right." }, { status: 400 });
  }

  await ensureIndexes();
  const col = await attendees();
  const now = new Date();

  const update: Partial<AttendeeDoc> = {
    name,
    phone,
    emailOptIn,
    smsOptIn: smsOptIn && !!phone,
    showPublicly,
    updatedAt: now,
  };

  await col.updateOne(
    { email },
    {
      $set: update,
      $setOnInsert: { email, createdAt: now, unsubscribedAt: null },
    },
    { upsert: true }
  );

  // Keep denormalized name + visibility on this attendee's signups fresh.
  await (await signups()).updateMany({ email }, { $set: { name, showPublicly } });

  const sessionIds = (await (await signups()).find({ email }).project({ sessionId: 1 }).toArray()).map(
    (d) => (d as { sessionId: string }).sessionId
  );

  const res = NextResponse.json({
    attendee: { name, email, phone, emailOptIn, smsOptIn: update.smsOptIn, showPublicly },
    sessionIds,
    feedToken: makeFeedToken(email),
  });
  res.cookies.set(IDENTITY_COOKIE, makeIdentityToken(email), IDENTITY_COOKIE_OPTS);
  // Touch cookies() so Next treats this as dynamic consistently.
  cookies();
  return res;
}
