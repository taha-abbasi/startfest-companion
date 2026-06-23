import { NextResponse } from "next/server";
import { signups, attendees } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Live attendance counts for every session + community stats, in one round-trip.
export async function GET() {
  try {
    const [rows, attendeeCount] = await Promise.all([
      (await signups())
        .aggregate<{ _id: string; n: number }>([{ $group: { _id: "$sessionId", n: { $sum: 1 } } }])
        .toArray(),
      (await attendees()).estimatedDocumentCount(),
    ]);
    const counts: Record<string, number> = {};
    let going = 0;
    for (const r of rows) {
      counts[r._id] = r.n;
      going += r.n;
    }
    return NextResponse.json(
      { counts, attendees: attendeeCount, going },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[counts] failed", e);
    return NextResponse.json({ counts: {}, attendees: 0, going: 0 }, { status: 200 });
  }
}
