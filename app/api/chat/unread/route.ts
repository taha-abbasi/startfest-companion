import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { messages } from "@/lib/db";
import { VALID_SESSION_IDS } from "@/data/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validRoom = (r: string) => r === "general" || VALID_SESSION_IDS.has(r);

// Count unread messages per room. Body: { rooms: { roomId: lastSeenId|null } }.
// Returns { unread: { roomId: count } } (capped at 100 per room for speed).
export async function POST(req: Request) {
  let body: { rooms?: Record<string, string | null> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ unread: {} }, { status: 200 });
  }
  const entries = Object.entries(body.rooms ?? {})
    .filter(([r]) => validRoom(r))
    .slice(0, 80);

  try {
    const col = await messages();
    const unread: Record<string, number> = {};
    await Promise.all(
      entries.map(async ([room, lastId]) => {
        const q: Record<string, unknown> = { room };
        if (lastId && /^[a-f0-9]{24}$/i.test(lastId)) {
          q._id = { $gt: new ObjectId(lastId) };
        }
        unread[room] = await col.countDocuments(q, { limit: 100 });
      })
    );
    return NextResponse.json({ unread }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[chat/unread] failed", e);
    return NextResponse.json({ unread: {} }, { status: 200 });
  }
}
