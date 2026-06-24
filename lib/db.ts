import { MongoClient, type Db, type Collection, type ObjectId } from "mongodb";

// ─────────────────────────────────────────────────────────────────────────────
// MongoDB connection — serverless-safe singleton.
//
// The app is intentionally scoped to ONE isolated database (MONGODB_DB, default
// "startfest"). It never reads or writes any other database on the cluster.
// ─────────────────────────────────────────────────────────────────────────────

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "startfest";

// All of this app's collections live under a dedicated prefix so they are fully
// isolated from any other collections that may share the same database.
const COLLECTION_PREFIX = process.env.MONGODB_COLLECTION_PREFIX ?? "startfest_";

if (!uri) {
  // Surface a clear error at runtime rather than a cryptic driver failure.
  console.warn("[db] MONGODB_URI is not set — database operations will fail.");
}

const options = {
  maxPoolSize: 8,
  serverSelectionTimeoutMS: 8000,
};

// Reuse the client across hot reloads (dev) and warm invocations (prod).
// Initialized lazily on first use so `next build` never opens a connection.
declare global {
  // eslint-disable-next-line no-var
  var _sfMongoClientPromise: Promise<MongoClient> | undefined;
}

function clientPromise(): Promise<MongoClient> {
  if (!uri) throw new Error("MONGODB_URI is not configured.");
  if (!global._sfMongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._sfMongoClientPromise = client.connect();
  }
  return global._sfMongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  return client.db(dbName);
}

// ── Document shapes ───────────────────────────────────────────────────────────

export interface AttendeeDoc {
  _id?: unknown;
  /** lowercased, trimmed email — the natural key */
  email: string;
  name: string;
  phone?: string | null;
  /** consent to receive transactional + reminder email about sessions they pick */
  emailOptIn: boolean;
  /** consent to receive SMS reminders (only meaningful if phone present) */
  smsOptIn: boolean;
  /** consent to have their name shown on public "who's going" lists */
  showPublicly: boolean;
  /** optional profile extras for the Slopers directory */
  avatar?: string | null; // compressed data URL
  x?: string | null; // X/Twitter profile URL
  linkedin?: string | null; // LinkedIn profile URL
  createdAt: Date;
  updatedAt: Date;
  /** set when the attendee globally unsubscribes from all email */
  unsubscribedAt?: Date | null;
  /** last conference day (YYYY-MM-DD) we sent a digest for — keeps cron idempotent */
  lastDigestDate?: string | null;
}

export interface SignupDoc {
  _id?: unknown;
  sessionId: string;
  email: string;
  /** denormalized for fast public listing without joining attendees */
  name: string;
  showPublicly: boolean;
  createdAt: Date;
  /** marks that the confirmation email was sent (best-effort) */
  confirmationSentAt?: Date | null;
  /** last day-digest we sent for, to keep the cron idempotent (YYYY-MM-DD) */
  lastDigestDate?: string | null;
}

export async function attendees(): Promise<Collection<AttendeeDoc>> {
  return (await getDb()).collection<AttendeeDoc>(`${COLLECTION_PREFIX}attendees`);
}

export async function signups(): Promise<Collection<SignupDoc>> {
  return (await getDb()).collection<SignupDoc>(`${COLLECTION_PREFIX}signups`);
}

export interface MessageDoc {
  _id?: ObjectId;
  /** "general" for the conference lounge, or a sessionId for a session room */
  room: string;
  email: string;
  name: string;
  text: string;
  createdAt: Date;
}

export async function messages(): Promise<Collection<MessageDoc>> {
  return (await getDb()).collection<MessageDoc>(`${COLLECTION_PREFIX}messages`);
}

let indexesEnsured = false;

/** Idempotently create indexes. Safe to call on every request (guarded). */
export async function ensureIndexes(): Promise<void> {
  if (indexesEnsured) return;
  const [a, s, m] = [await attendees(), await signups(), await messages()];
  await Promise.all([
    a.createIndex({ email: 1 }, { unique: true }),
    s.createIndex({ sessionId: 1, email: 1 }, { unique: true }),
    s.createIndex({ sessionId: 1 }),
    s.createIndex({ email: 1 }),
    m.createIndex({ room: 1, _id: 1 }),
    m.createIndex({ email: 1, createdAt: -1 }),
  ]);
  indexesEnsured = true;
}
