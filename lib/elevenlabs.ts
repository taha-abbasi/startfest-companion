// ElevenLabs Scribe (speech-to-text) + Voice Isolation.
// Stateless REST usage with the account API key — no conversational agents touched.

const EL = "https://api.elevenlabs.io/v1";

function key(): string {
  const k = process.env.ELEVENLABS_API_KEY;
  if (!k) throw new Error("ELEVENLABS_API_KEY is not configured.");
  return k;
}

/** Remove background/crowd noise, isolating speech. Returns mp3 bytes. */
export async function isolateAudio(buf: Buffer, filename: string, mime: string): Promise<Buffer> {
  const form = new FormData();
  form.append("audio", new Blob([new Uint8Array(buf)], { type: mime }), filename);
  const r = await fetch(`${EL}/audio-isolation`, {
    method: "POST",
    headers: { "xi-api-key": key() },
    body: form,
  });
  if (!r.ok) throw new Error(`isolation_failed_${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

export interface ScribeWord {
  text: string;
  type?: string; // "word" | "spacing" | "audio_event"
  speaker_id?: string;
  start?: number;
  end?: number;
}
export interface ScribeResult {
  text: string;
  language_code?: string;
  words?: ScribeWord[];
}

/** Transcribe audio with Scribe, including speaker diarization. */
export async function transcribe(
  buf: Buffer,
  filename: string,
  mime: string,
  diarize = true
): Promise<ScribeResult> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buf)], { type: mime }), filename);
  form.append("model_id", "scribe_v1");
  form.append("tag_audio_events", "false");
  if (diarize) form.append("diarize", "true");
  const r = await fetch(`${EL}/speech-to-text`, {
    method: "POST",
    headers: { "xi-api-key": key() },
    body: form,
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`scribe_failed_${r.status}_${t.slice(0, 120)}`);
  }
  return (await r.json()) as ScribeResult;
}

export interface Segment {
  speaker: string;
  text: string;
}

/** Group diarized words into readable per-speaker segments. */
export function toSegments(words: ScribeWord[] | undefined): Segment[] {
  if (!words || !words.length) return [];
  const segs: Segment[] = [];
  let cur: Segment | null = null;
  for (const w of words) {
    if (w.type === "spacing") {
      if (cur) cur.text += w.text;
      continue;
    }
    const sp = w.speaker_id || "speaker_0";
    if (!cur || cur.speaker !== sp) {
      cur = { speaker: sp, text: w.text };
      segs.push(cur);
    } else {
      cur.text += w.text;
    }
  }
  return segs.map((s) => ({ speaker: s.speaker, text: s.text.trim() })).filter((s) => s.text);
}
