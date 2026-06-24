// Lenient normalization of X (Twitter) and LinkedIn inputs into profile URLs.
// Accepts a full URL or a bare handle. Returns null when empty/invalid.

function handleFrom(raw: string): string {
  return raw
    .trim()
    .replace(/^@/, "")
    .replace(/\/+$/, "")
    .split("/")
    .pop()!
    .split("?")[0]
    .replace(/[^A-Za-z0-9_.-]/g, "");
}

export function normalizeX(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const v = String(raw).trim();
  if (!v) return null;
  if (/^https?:\/\/(www\.)?(x|twitter)\.com\//i.test(v)) return v.slice(0, 200);
  const h = handleFrom(v);
  return h ? `https://x.com/${h}`.slice(0, 200) : null;
}

export function normalizeLinkedIn(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const v = String(raw).trim();
  if (!v) return null;
  if (/^https?:\/\/(www\.)?linkedin\.com\//i.test(v)) return v.slice(0, 200);
  // bare "in/foo" or "foo"
  const m = v.replace(/^@/, "").replace(/^in\//i, "");
  const h = handleFrom(m);
  return h ? `https://www.linkedin.com/in/${h}` : null;
}

/** Validate a stored/compressed avatar data URL; returns it or null. */
export function sanitizeAvatar(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const v = String(raw);
  if (!/^data:image\/(jpeg|png|webp);base64,/i.test(v)) return null;
  if (v.length > 240_000) return null; // ~180KB cap
  return v;
}
