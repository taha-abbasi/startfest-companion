import { NextResponse } from "next/server";
import { getIdentityEmail } from "@/lib/identity";
import { isolateAudio, transcribe, toSegments } from "@/lib/elevenlabs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 25 * 1024 * 1024; // 25MB per chunk

export async function POST(req: Request) {
  // Identity-gated so the (paid) STT keys can't be abused anonymously.
  if (!getIdentityEmail()) {
    return NextResponse.json({ error: "identify_required" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const file = form.get("audio");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_audio" }, { status: 400 });
  }
  if (file.size === 0) return NextResponse.json({ error: "empty_audio" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "too_large" }, { status: 413 });

  const isolate = form.get("isolate") === "true";
  let buf: Buffer = Buffer.from(await file.arrayBuffer());
  let filename = file.name || "chunk.webm";
  let mime = file.type || "audio/webm";

  try {
    if (isolate) {
      buf = await isolateAudio(buf, filename, mime);
      filename = "clean.mp3";
      mime = "audio/mpeg";
    }
    const result = await transcribe(buf, filename, mime, true);
    return NextResponse.json({
      text: result.text ?? "",
      segments: toSegments(result.words),
      language: result.language_code ?? null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "transcribe_failed";
    console.error("[transcribe]", msg);
    // Concurrency/capacity from ElevenLabs → 429 so the client shows the
    // "at capacity" state and steers people to the shared session summary.
    // The chunk stays queued and retries, so nothing is lost when a slot frees.
    if (/_429|_503|too_many|system_busy|concurrent/i.test(msg)) {
      return NextResponse.json({ error: "at_capacity" }, { status: 429 });
    }
    // Other errors: 502 so the client keeps the chunk queued and retries.
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
