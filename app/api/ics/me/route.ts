import { signups } from "@/lib/db";
import { getIdentityEmail, verifyManageToken, verifyFeedToken } from "@/lib/identity";
import { getSession, sessionStart, type Session } from "@/data/schedule";
import { buildIcs, icsFilename } from "@/lib/ics";
import { getBaseUrl } from "@/lib/baseUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Calendar of everything the current attendee has picked.
// Identity comes from the cookie, or a signed ?t= manage token (for email links).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const t = url.searchParams.get("t");
  // Accept a read-only feed token (for live subscriptions) or a manage token,
  // falling back to the session cookie for in-app downloads.
  const tokenEmail = verifyFeedToken(t) || verifyManageToken(t);
  const email = tokenEmail || getIdentityEmail();
  if (!email) return new Response("Not identified", { status: 401 });

  const docs = await (await signups()).find({ email }).project({ sessionId: 1, _id: 0 }).toArray();
  const sessions = docs
    .map((d) => getSession((d as { sessionId: string }).sessionId))
    .filter((s): s is Session => !!s)
    .sort((a, b) => sessionStart(a).getTime() - sessionStart(b).getTime());

  const ics = buildIcs(sessions, getBaseUrl());
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${icsFilename()}"`,
      "Cache-Control": "no-store",
    },
  });
}
