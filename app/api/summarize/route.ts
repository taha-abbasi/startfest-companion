import { NextResponse } from "next/server";
import { getIdentityEmail } from "@/lib/identity";
import { summarize } from "@/lib/openaiSummary";
import { getSession, speakerLine } from "@/data/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!getIdentityEmail()) {
    return NextResponse.json({ error: "identify_required" }, { status: 401 });
  }

  let body: { transcript?: string; sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const transcript = (body.transcript ?? "").trim();
  if (transcript.length < 40) {
    return NextResponse.json({ error: "not_enough_transcript" }, { status: 400 });
  }

  const session = body.sessionId ? getSession(body.sessionId) : undefined;

  try {
    const highlights = await summarize(transcript, {
      title: session?.title,
      speaker: session ? speakerLine(session) : undefined,
    });
    return NextResponse.json({ highlights });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "summarize_failed";
    console.error("[summarize]", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
