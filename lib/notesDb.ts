// Local-first storage for session notes: audio chunks (offline queue),
// transcript, and photos — all kept on-device in IndexedDB.

import type { Segment } from "@/lib/elevenlabs";

const DB_NAME = "startfest-notes";
const DB_VERSION = 1;

export interface NotesDoc {
  sessionId: string;
  segments: Segment[];
  language?: string | null;
  summary?: {
    tldr: string;
    keyPoints: string[];
    actionItems: string[];
    quotes: string[];
    resources: string[];
  } | null;
  updatedAt: number;
}

export interface ChunkRec {
  id?: number;
  sessionId: string;
  seq: number;
  blob: Blob;
  mime: string;
  isolate: boolean;
}

export interface PhotoRec {
  id?: number;
  sessionId: string;
  blob: Blob;
  createdAt: number;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no_indexeddb"));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("chunks")) {
        const s = db.createObjectStore("chunks", { keyPath: "id", autoIncrement: true });
        s.createIndex("sessionId", "sessionId", { unique: false });
      }
      if (!db.objectStoreNames.contains("notes")) {
        db.createObjectStore("notes", { keyPath: "sessionId" });
      }
      if (!db.objectStoreNames.contains("photos")) {
        const p = db.createObjectStore("photos", { keyPath: "id", autoIncrement: true });
        p.createIndex("sessionId", "sessionId", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
      })
  );
}

function allBySession<T>(store: string, sessionId: string): Promise<T[]> {
  return open().then(
    (db) =>
      new Promise<T[]>((resolve, reject) => {
        const t = db.transaction(store, "readonly");
        const idx = t.objectStore(store).index("sessionId");
        const req = idx.getAll(IDBKeyRange.only(sessionId));
        req.onsuccess = () => resolve(req.result as T[]);
        req.onerror = () => reject(req.error);
      })
  );
}

// ── chunks (offline transcription queue) ─────────────────────────────────────
export const addChunk = (c: ChunkRec) => tx<number>("chunks", "readwrite", (s) => s.add(c));
export const deleteChunk = (id: number) => tx<undefined>("chunks", "readwrite", (s) => s.delete(id));
export async function pendingChunks(sessionId: string): Promise<ChunkRec[]> {
  const list = await allBySession<ChunkRec>("chunks", sessionId);
  return list.sort((a, b) => a.seq - b.seq);
}

// ── notes (transcript + summary) ─────────────────────────────────────────────
export const saveNotes = (doc: NotesDoc) => tx<string>("notes", "readwrite", (s) => s.put(doc));
export function getNotes(sessionId: string): Promise<NotesDoc | undefined> {
  return tx<NotesDoc | undefined>("notes", "readonly", (s) => s.get(sessionId));
}

// ── photos ───────────────────────────────────────────────────────────────────
export const addPhoto = (p: PhotoRec) => tx<number>("photos", "readwrite", (s) => s.add(p));
export const deletePhoto = (id: number) => tx<undefined>("photos", "readwrite", (s) => s.delete(id));
export const getPhotos = (sessionId: string) => allBySession<PhotoRec>("photos", sessionId);
