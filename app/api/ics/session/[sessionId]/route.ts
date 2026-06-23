import { getSession } from "@/data/schedule";
import { buildIcs, icsFilename } from "@/lib/ics";
import { getBaseUrl } from "@/lib/baseUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { sessionId: string } }) {
  const session = getSession(params.sessionId);
  if (!session) return new Response("Not found", { status: 404 });

  const ics = buildIcs([session], getBaseUrl());
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${icsFilename(session)}"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
