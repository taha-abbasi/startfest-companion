// OpenAI-powered highlight extraction from a (possibly noisy/partial) transcript.

export interface Highlights {
  tldr: string;
  keyPoints: string[];
  actionItems: string[];
  quotes: string[];
  resources: string[];
}

export async function summarize(
  transcript: string,
  ctx: { title?: string; speaker?: string }
): Promise<Highlights> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const system =
    "You are a sharp conference note-taker. You're given a transcript of a live talk that may be noisy, partial, or imperfectly transcribed. Extract genuinely useful notes for an attendee. Be concise and concrete; never invent facts that aren't supported by the transcript. Respond ONLY as JSON with keys: tldr (string, 1-2 sentences), keyPoints (string[] of short bullets), actionItems (string[], may be empty), quotes (string[] of notable verbatim lines, may be empty), resources (string[] of tools/books/companies/links/people mentioned, may be empty).";

  const user = `Session: ${ctx.title || "Unknown"}\nSpeaker(s): ${ctx.speaker || "Unknown"}\n\nTranscript:\n${transcript.slice(0, 24000)}`;

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`openai_failed_${r.status}_${t.slice(0, 120)}`);
  }
  const data = await r.json();
  let parsed: Partial<Highlights> = {};
  try {
    parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
  } catch {
    parsed = {};
  }
  return {
    tldr: typeof parsed.tldr === "string" ? parsed.tldr : "",
    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.map(String) : [],
    actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems.map(String) : [],
    quotes: Array.isArray(parsed.quotes) ? parsed.quotes.map(String) : [],
    resources: Array.isArray(parsed.resources) ? parsed.resources.map(String) : [],
  };
}
