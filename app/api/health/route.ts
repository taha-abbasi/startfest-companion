import { getDb, signups } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lightweight health check: verifies DB connectivity. Never returns secrets.
export async function GET() {
  const started = Date.now();
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    await (await signups()).estimatedDocumentCount();
    return Response.json({ ok: true, ms: Date.now() - started });
  } catch (e: unknown) {
    const err = e as { name?: string; message?: string; code?: unknown; codeName?: string };
    return Response.json(
      {
        ok: false,
        name: err?.name ?? "Error",
        message: String(err?.message ?? e).slice(0, 400),
        code: err?.code,
        codeName: err?.codeName,
        ms: Date.now() - started,
      },
      { status: 200 }
    );
  }
}
