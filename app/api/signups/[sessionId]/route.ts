import { NextResponse } from "next/server";
import { signups } from "@/lib/db";
import { getIdentityEmail } from "@/lib/identity";
import { getSession } from "@/data/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: { sessionId: string } }) {
  const email = getIdentityEmail();
  if (!email) return NextResponse.json({ error: "identify_required" }, { status: 401 });

  const sessionId = params.sessionId;
  if (!getSession(sessionId)) {
    return NextResponse.json({ error: "Unknown session." }, { status: 404 });
  }

  const sCol = await signups();
  await sCol.deleteOne({ sessionId, email });
  const count = await sCol.countDocuments({ sessionId });

  return NextResponse.json({ ok: true, sessionId, count });
}
