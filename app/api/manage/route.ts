import { NextResponse } from "next/server";
import {
  verifyManageToken,
  makeIdentityToken,
  IDENTITY_COOKIE,
  IDENTITY_COOKIE_OPTS,
} from "@/lib/identity";
import { getBaseUrl } from "@/lib/baseUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Email "manage my schedule" links land here: verify the signed token, set the
// identity cookie (so the attendee can edit on this device), then drop them on
// the app with their schedule loaded.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = verifyManageToken(url.searchParams.get("t"));
  const base = getBaseUrl();

  if (!email) {
    return NextResponse.redirect(`${base}/?manage=invalid`);
  }

  const res = NextResponse.redirect(`${base}/?view=agenda&welcome=1`);
  res.cookies.set(IDENTITY_COOKIE, makeIdentityToken(email), IDENTITY_COOKIE_OPTS);
  return res;
}
