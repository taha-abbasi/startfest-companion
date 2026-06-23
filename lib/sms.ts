// ─────────────────────────────────────────────────────────────────────────────
// Pluggable SMS. No-op unless Twilio credentials are configured.
//
// Today, phone reminders are delivered through calendar alarms (see lib/ics.ts),
// which fire natively on the attendee's device. If/when TWILIO_* env vars are
// added, opted-in attendees with a phone number will also receive texts — no
// other code changes required.
// ─────────────────────────────────────────────────────────────────────────────

export function smsEnabled(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER
  );
}

export async function sendSms(to: string, body: string): Promise<{ ok: boolean; skipped?: boolean }> {
  if (!smsEnabled()) return { ok: true, skipped: true };

  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_FROM_NUMBER!;

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
    });
    return { ok: res.ok };
  } catch (e) {
    console.error("[sms] send failed", e);
    return { ok: false };
  }
}

/** Light normalization to E.164-ish; returns null if clearly unusable. */
export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/[^\d+]/g, "");
  const justDigits = digits.replace(/\D/g, "");
  if (justDigits.length < 7 || justDigits.length > 15) return null;
  if (digits.startsWith("+")) return "+" + justDigits;
  // Assume US/Canada if 10 digits.
  if (justDigits.length === 10) return "+1" + justDigits;
  if (justDigits.length === 11 && justDigits.startsWith("1")) return "+" + justDigits;
  return "+" + justDigits;
}
