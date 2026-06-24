import { NextResponse } from "next/server";
import { attendees, signups } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public Slopers directory: only attendees who consented to be shown.
// Returns name, avatar, socials, and the sessions they're attending.
// Email and phone are NEVER included.
export async function GET() {
  try {
    const aCol = await attendees();
    const signupsName = (await signups()).collectionName;

    const rows = await aCol
      .aggregate([
        { $match: { showPublicly: true, name: { $exists: true, $ne: "" } } },
        {
          $lookup: {
            from: signupsName,
            localField: "email",
            foreignField: "email",
            as: "s",
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            avatar: 1,
            x: 1,
            linkedin: 1,
            sessionIds: "$s.sessionId",
          },
        },
        { $addFields: { count: { $size: "$sessionIds" } } },
        { $sort: { count: -1, name: 1 } },
        { $limit: 600 },
      ])
      .toArray();

    const slopers = rows.map((r) => ({
      id: String(r._id),
      name: r.name as string,
      avatar: (r.avatar as string) ?? null,
      x: (r.x as string) ?? null,
      linkedin: (r.linkedin as string) ?? null,
      sessionIds: (r.sessionIds as string[]) ?? [],
    }));

    return NextResponse.json(
      { slopers, total: slopers.length },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[directory] failed", e);
    return NextResponse.json({ slopers: [], total: 0 }, { status: 200 });
  }
}
