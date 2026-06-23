import crypto from "crypto";
import { cookies } from "next/headers";

// ─────────────────────────────────────────────────────────────────────────────
// Auth-less identity.
//
// Attendees never create a password. When they tell us who they are, we set a
// signed cookie binding the browser to their (normalized) email. The signature
// (HMAC-SHA256 over the email using APP_SECRET) means a visitor cannot forge
// another person's identity by editing the cookie.
//
// The same HMAC scheme issues stateless "manage" / "unsubscribe" tokens that go
// in email links, so people can manage their schedule from any device.
// ─────────────────────────────────────────────────────────────────────────────

const SECRET = process.env.APP_SECRET || "dev-insecure-secret-change-me";
export const IDENTITY_COOKIE = "sf_id";

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(raw: string): boolean {
  const e = raw.trim();
  // Pragmatic, not RFC-exhaustive.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", SECRET).update(value).digest("base64url");
}

/** Constant-time compare to avoid timing oracles on the signature. */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/** Produce a cookie value of the form `<email-b64url>.<sig>`. */
export function makeIdentityToken(email: string): string {
  const e = normalizeEmail(email);
  const payload = Buffer.from(e).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyIdentityToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!safeEqual(sig, sign(payload))) return null;
  try {
    return Buffer.from(payload, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

/** Read the current attendee email from the request cookies, or null. */
export function getIdentityEmail(): string | null {
  const token = cookies().get(IDENTITY_COOKIE)?.value;
  return verifyIdentityToken(token);
}

export const IDENTITY_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 120, // 120 days — comfortably past the event
};

// ── Scoped, purpose-bound tokens for email links ─────────────────────────────
// token = `<purpose>:<email-b64>.<sig>` so a manage token can't be replayed as
// an unsubscribe token and vice-versa.

function scopedSign(purpose: string, email: string): string {
  const e = normalizeEmail(email);
  const payload = `${purpose}:${Buffer.from(e).toString("base64url")}`;
  return `${payload}.${sign(payload)}`;
}

function scopedVerify(purpose: string, token: string | undefined | null): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!payload.startsWith(`${purpose}:`)) return null;
  if (!safeEqual(sig, sign(payload))) return null;
  try {
    return Buffer.from(payload.slice(purpose.length + 1), "base64url").toString("utf8");
  } catch {
    return null;
  }
}

export const makeManageToken = (email: string) => scopedSign("manage", email);
export const verifyManageToken = (t: string | undefined | null) => scopedVerify("manage", t);
export const makeUnsubToken = (email: string) => scopedSign("unsub", email);
export const verifyUnsubToken = (t: string | undefined | null) => scopedVerify("unsub", t);

// "feed" tokens are read-only: they grant access to an attendee's calendar feed
// (for live calendar subscriptions) but — unlike a manage token — cannot be used
// to sign in. Safe to embed in a webcal subscription URL.
export const makeFeedToken = (email: string) => scopedSign("feed", email);
export const verifyFeedToken = (t: string | undefined | null) => scopedVerify("feed", t);
