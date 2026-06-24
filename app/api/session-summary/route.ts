import { NextResponse } from "next/server";
import { noteShares, noteSummaries, type Highlights } from "@/lib/db";
import { getIdentityEmail } from "@/lib/identity";
import { mergeSummaries } from "@/lib/openaiSummary";
import { getSession, speakerLine, VALID_SESSION_IDS } from "@/data/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function cleanHighlights(h: unknown): Highlights | null {
  if (!h || typeof h !== "object") return null;
  const x = h as Record<string, unknown>;
  const arr = (v: unknown) => (Array.isArray(v) ? v.map(String).slice(0, 20) : []);
  const out: Highlights = {
    tldr: typeof x.tldr === "string" ? x.tldr.slice(0, 600) : "",
    keyPoints: arr(x.keyPoints),
    actionItems: arr(x.actionItems),
    quotes: arr(x.quotes),
    resources: arr(x.resources),
  };
  if (!out.tldr && out.keyPoints.length === 0) return null;
  return out;
}

// Public: the combined session summary that everyone can read.
export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("sessionId") || "";
  if (!VALID_SESSION_IDS.has(sessionId)) {
    return NextResponse.json({ error: "bad_session" }, { status: 400 });
  }
  const doc = await (await noteSummaries()).findOne({ _id: sessionId });
  if (!doc) return NextResponse.json({ summary: null, count: 0, contributors: [] });
  return NextResponse.json(
    { summary: doc.summary, count: doc.count, contributors: doc.contributors, updatedAt: doc.updatedAt },
    { headers: { "Cache-Control": "no-store" } }
  );
}

// Share your highlights with the session → re-merge into one holistic summary.
export async function POST(req: Request) {
  const email = getIdentityEmail();
  if (!email) return NextResponse.json({ error: "identify_required" }, { status: 401 });

  let body: { sessionId?: string; highlights?: unknown; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const sessionId = String(body.sessionId ?? "");
  const session = getSession(sessionId);
  if (!session || !VALID_SESSION_IDS.has(sessionId)) {
    return NextResponse.json({ error: "bad_session" }, { status: 400 });
  }
  const highlights = cleanHighlights(body.highlights);
  if (!highlights) return NextResponse.json({ error: "empty_highlights" }, { status: 400 });

  const name = (typeof body.name === "string" && body.name.trim()) || "A Sloper";
  const shares = await noteShares();

  await shares.updateOne(
    { sessionId, email },
    { $set: { sessionId, email, name, highlights, createdAt: new Date() } },
    { upsert: true }
  );

  // Re-merge the latest contributions into one deduplicated summary.
  const all = await shares.find({ sessionId }).sort({ createdAt: -1 }).limit(12).toArray();
  const contributors = Array.from(new Set(all.map((s) => s.name).filter(Boolean)));
  let merged: Highlights;
  try {
    merged = await mergeSummaries(
      all.map((s) => s.highlights),
      { title: session.title, speaker: speakerLine(session) }
    );
  } catch (e) {
    // If the merge model is unavailable, fall back to the newest contribution.
    console.error("[session-summary] merge failed", e);
    merged = all[0]?.highlights ?? highlights;
  }

  const doc = {
    _id: sessionId,
    summary: merged,
    contributors,
    count: contributors.length,
    updatedAt: new Date(),
  };
  await (await noteSummaries()).updateOne({ _id: sessionId }, { $set: doc }, { upsert: true });

  return NextResponse.json({ summary: merged, count: doc.count, contributors });
}
