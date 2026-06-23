import { attendees } from "@/lib/db";
import { verifyUnsubToken } from "@/lib/identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function doUnsub(email: string) {
  await (await attendees()).updateOne(
    { email },
    { $set: { emailOptIn: false, smsOptIn: false, unsubscribedAt: new Date() } }
  );
}

// One-click unsubscribe (RFC 8058 List-Unsubscribe-Post).
export async function POST(req: Request) {
  const url = new URL(req.url);
  const email = verifyUnsubToken(url.searchParams.get("t"));
  if (email) await doUnsub(email);
  return new Response("OK", { status: 200 });
}

// Human-visible unsubscribe confirmation.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = verifyUnsubToken(url.searchParams.get("t"));
  const ok = !!email;
  if (email) await doUnsub(email);

  const html = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribed · StartFest</title>
<style>
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
       background:linear-gradient(160deg,#071a45,#0e2f87 55%,#16708a);min-height:100vh;display:flex;align-items:center;justify-content:center;color:#0b1f4d;}
  .card{background:#fff;max-width:440px;margin:24px;padding:34px;border-radius:18px;box-shadow:0 24px 60px -20px rgba(0,0,0,.5);}
  h1{margin:0 0 10px;font-size:22px;}
  p{color:#5b6b8c;line-height:1.6;font-size:15px;}
  a{display:inline-block;margin-top:18px;background:#c6f23e;color:#0b1f4d;text-decoration:none;font-weight:800;padding:11px 20px;border-radius:10px;}
  .tag{color:#a9d62b;font-weight:800;letter-spacing:.12em;text-transform:uppercase;font-size:12px}
</style></head>
<body><div class="card">
  <div class="tag">StartFest 2026</div>
  <h1>${ok ? "You're unsubscribed" : "Link expired"}</h1>
  <p>${
    ok
      ? "You won't receive any more StartFest email. Your saved sessions still live on the app, and calendar reminders you already added will still fire on your phone."
      : "We couldn't verify this unsubscribe link. If you keep getting unwanted email, just reply and we'll remove you."
  }</p>
  <a href="/">Back to StartFest</a>
</div></body></html>`;

  return new Response(html, {
    status: ok ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
