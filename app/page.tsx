import { AppClient } from "@/components/AppClient";
import { getIdentityEmail } from "@/lib/identity";
import { attendees, signups } from "@/lib/db";
import type { Attendee } from "@/components/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function loadInitial(): Promise<{
  attendee: Attendee | null;
  sessionIds: string[];
  counts: Record<string, number>;
}> {
  let attendee: Attendee | null = null;
  let sessionIds: string[] = [];
  let counts: Record<string, number> = {};

  try {
    const email = getIdentityEmail();
    if (email) {
      const att = await (await attendees()).findOne({ email });
      if (att) {
        attendee = {
          name: att.name,
          email: att.email,
          phone: att.phone ?? null,
          emailOptIn: att.emailOptIn,
          smsOptIn: att.smsOptIn,
          showPublicly: att.showPublicly,
        };
        const ids = await (await signups()).find({ email }).project({ sessionId: 1, _id: 0 }).toArray();
        sessionIds = ids.map((d) => (d as { sessionId: string }).sessionId);
      }
    }

    const rows = await (await signups())
      .aggregate<{ _id: string; n: number }>([{ $group: { _id: "$sessionId", n: { $sum: 1 } } }])
      .toArray();
    for (const r of rows) counts[r._id] = r.n;
  } catch (e) {
    // DB unavailable — render the public agenda anyway with zeroed live data.
    console.error("[page] initial load failed:", e);
  }

  return { attendee, sessionIds, counts };
}

export default async function Page() {
  const { attendee, sessionIds, counts } = await loadInitial();
  return (
    <AppClient initialAttendee={attendee} initialSessionIds={sessionIds} initialCounts={counts} />
  );
}
