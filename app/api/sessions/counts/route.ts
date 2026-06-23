import { NextResponse } from "next/server";
import { signups } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Live attendance counts for every session, in one aggregation.
export async function GET() {
  try {
    const rows = await (await signups())
      .aggregate<{ _id: string; n: number }>([{ $group: { _id: "$sessionId", n: { $sum: 1 } } }])
      .toArray();
    const counts: Record<string, number> = {};
    for (const r of rows) counts[r._id] = r.n;
    return NextResponse.json(
      { counts },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[counts] failed", e);
    return NextResponse.json({ counts: {} }, { status: 200 });
  }
}
