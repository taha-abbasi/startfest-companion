import { NextResponse } from "next/server";
import { signups } from "@/lib/db";
import { getSession } from "@/data/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public "who's going" list. Returns ONLY names of attendees who consented to be
// shown. Email/phone are never exposed. Everyone else is reflected as a count.
export async function GET(_req: Request, { params }: { params: { sessionId: string } }) {
  const sessionId = params.sessionId;
  if (!getSession(sessionId)) {
    return NextResponse.json({ error: "Unknown session." }, { status: 404 });
  }

  const sCol = await signups();
  const total = await sCol.countDocuments({ sessionId });
  const publicDocs = await sCol
    .find({ sessionId, showPublicly: true })
    .project({ name: 1, _id: 0 })
    .sort({ createdAt: 1 })
    .limit(200)
    .toArray();

  const names = publicDocs.map((d) => (d as { name: string }).name).filter(Boolean);
  const hiddenCount = Math.max(0, total - names.length);

  return NextResponse.json(
    { sessionId, total, names, hiddenCount },
    { headers: { "Cache-Control": "no-store" } }
  );
}
