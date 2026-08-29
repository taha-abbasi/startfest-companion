import { NextResponse } from "next/server";
import { attendees } from "@/lib/db";
import { isValidEmail, normalizeEmail, makeManageToken, makeUnsubToken } from "@/lib/identity";
import { getBaseUrl } from "@/lib/baseUrl";
import { sendSignInEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Passwordless sign-in: email an existing attendee a magic link that restores
// their full profile (via /api/manage). Does nothing for unknown emails.
export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const raw = String(body.email ?? "").trim();
  if (!isValidEmail(raw)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  const email = normalizeEmail(raw);

  const att = await (await attendees()).findOne({ email });
  if (!att) {
    return NextResponse.json({ found: false });
  }

  const base = getBaseUrl();
  const result = await sendSignInEmail({
    to: email,
    name: att.name,
    signInUrl: `${base}/api/manage?t=${encodeURIComponent(makeManageToken(email))}`,
    unsubUrl: `${base}/api/unsubscribe?t=${encodeURIComponent(makeUnsubToken(email))}`,
  });

  if (!result.ok) {
    console.error("[signin] email failed:", result.error);
    return NextResponse.json({ found: true, sent: false, error: "email_failed" }, { status: 502 });
  }
  return NextResponse.json({ found: true, sent: !result.skipped });
}
