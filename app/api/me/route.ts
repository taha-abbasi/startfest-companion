import { NextResponse } from "next/server";
import { attendees, signups } from "@/lib/db";
import { getIdentityEmail } from "@/lib/identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const email = getIdentityEmail();
  if (!email) return NextResponse.json({ attendee: null, sessionIds: [] });

  const att = await (await attendees()).findOne({ email });
  if (!att) return NextResponse.json({ attendee: null, sessionIds: [] });

  const sessionIds = (
    await (await signups()).find({ email }).project({ sessionId: 1 }).toArray()
  ).map((d) => (d as { sessionId: string }).sessionId);

  return NextResponse.json({
    attendee: {
      name: att.name,
      email: att.email,
      phone: att.phone ?? null,
      emailOptIn: att.emailOptIn,
      smsOptIn: att.smsOptIn,
      showPublicly: att.showPublicly,
    },
    sessionIds,
  });
}
