"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/store";
import { getSession, formatTimeRange, ROOMS, TRACKS, speakerLine } from "@/data/schedule";
import type { Segment } from "@/lib/elevenlabs";
import {
  addChunk,
  deleteChunk,
  pendingChunks,
  saveNotes,
  getNotes,
  addPhoto,
  deletePhoto,
  getPhotos,
  type NotesDoc,
  type PhotoRec,
} from "@/lib/notesDb";
import { X, Mic, Square, Camera, Sparkle, Trash, Copy, Check, Users, Warn } from "@/components/icons";
import { SessionSummary } from "@/components/SessionSummary";

const SEGMENT_MS = 25000;

interface Highlights {
  tldr: string;
  keyPoints: string[];
  actionItems: string[];
  quotes: string[];
  resources: string[];
}
interface Photo {
  id: number;
  url: string;
}

function pickMime(): string {
  const cands = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];
  if (typeof MediaRecorder === "undefined") return "";
  for (const m of cands) if (MediaRecorder.isTypeSupported(m)) return m;
  return "";
}
function extFor(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("aac")) return "aac";
  return "dat";
}

export function SessionNotes() {
  const { notesSessionId, closeNotes, attendee, openOnboarding, pushToast } = useApp();
  const sessionId = notesSessionId;

  const [recording, setRecording] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isolate, setIsolate] = useState(false);
  const [queue, setQueue] = useState(0);
  const [busyTranscribe, setBusyTranscribe] = useState(false);
  const [offline, setOffline] = useState(false);
  const [summary, setSummary] = useState<Highlights | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [supported, setSupported] = useState(true);
  const [atCapacity, setAtCapacity] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [summaryReload, setSummaryReload] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingRef = useRef(false);
  const seqRef = useRef(0);
  const processingRef = useRef(false);
  const segRef = useRef<Segment[]>([]);
  const langRef = useRef<string | null>(null);
  const speakerMap = useRef<Map<string, number>>(new Map());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  segRef.current = segments;

  const session = sessionId ? getSession(sessionId) : null;

  const persist = useCallback(
    (extra?: Partial<NotesDoc>) => {
      if (!sessionId) return;
      saveNotes({
        sessionId,
        segments: segRef.current,
        language: langRef.current,
        summary: summary,
        updatedAt: Date.now(),
        ...extra,
      }).catch(() => {});
    },
    [sessionId, summary]
  );

  // Process the offline queue sequentially (preserves order; survives bad WiFi).
  const processQueue = useCallback(async () => {
    if (!sessionId || processingRef.current) return;
    processingRef.current = true;
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const pend = await pendingChunks(sessionId);
        setQueue(pend.length);
        if (!pend.length) break;
        const chunk = pend[0];
        setBusyTranscribe(true);
        const fd = new FormData();
        const fname = `chunk-${chunk.seq}.${extFor(chunk.mime)}`;
        fd.append("audio", new File([chunk.blob], fname, { type: chunk.mime }));
        fd.append("isolate", chunk.isolate ? "true" : "false");
        let res: Response;
        try {
          res = await fetch("/api/transcribe", { method: "POST", body: fd });
        } catch {
          setOffline(true);
          break; // network down — retry later, keep chunk
        }
        if (res.status === 401) {
          openOnboarding(null);
          break;
        }
        if (res.status === 429) {
          // transcription is at capacity — keep the chunk queued, retry later,
          // and tell the user (their audio is safe; a slot will free up).
          setAtCapacity(true);
          break;
        }
        if (!res.ok) {
          // server/STT hiccup — keep chunk, retry later
          setOffline(res.status === 502 ? false : offline);
          break;
        }
        setOffline(false);
        setAtCapacity(false);
        const data = await res.json();
        const segs: Segment[] = (data.segments ?? []).map((s: Segment) => ({
          speaker: s.speaker,
          text: s.text,
        }));
        if (data.language) langRef.current = data.language;
        if (segs.length) {
          setSegments((prev) => {
            const next = [...prev, ...segs];
            segRef.current = next;
            return next;
          });
        }
        if (typeof chunk.id === "number") await deleteChunk(chunk.id);
        persist();
      }
    } finally {
      processingRef.current = false;
      setBusyTranscribe(false);
      const left = sessionId ? (await pendingChunks(sessionId)).length : 0;
      setQueue(left);
    }
  }, [sessionId, openOnboarding, persist, offline]);

  // Load saved notes + photos when opening; resume any queued chunks.
  useEffect(() => {
    if (!sessionId) return;
    let revoke: string[] = [];
    (async () => {
      const doc = await getNotes(sessionId).catch(() => undefined);
      if (doc) {
        setSegments(doc.segments ?? []);
        segRef.current = doc.segments ?? [];
        langRef.current = doc.language ?? null;
        setSummary(doc.summary ?? null);
      }
      const ph = await getPhotos(sessionId).catch(() => [] as PhotoRec[]);
      const mapped = ph.map((p) => ({ id: p.id as number, url: URL.createObjectURL(p.blob) }));
      revoke = mapped.map((m) => m.url);
      setPhotos(mapped);
      processQueue();
    })();
    return () => revoke.forEach((u) => URL.revokeObjectURL(u));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Periodic retry + reconnect handling while open.
  useEffect(() => {
    if (!sessionId) return;
    const iv = setInterval(() => processQueue(), 8000);
    const onOnline = () => processQueue();
    window.addEventListener("online", onOnline);
    return () => {
      clearInterval(iv);
      window.removeEventListener("online", onOnline);
    };
  }, [sessionId, processQueue]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !recording && closeNotes();
    if (sessionId) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sessionId, recording, closeNotes]);

  const handleSegment = useCallback(
    async (blob: Blob, mime: string) => {
      if (!sessionId || blob.size < 1200) return;
      const seq = seqRef.current++;
      await addChunk({ sessionId, seq, blob, mime, isolate }).catch(() => {});
      processQueue();
    },
    [sessionId, isolate, processQueue]
  );

  const startSegment = useCallback(
    (mime: string) => {
      const stream = streamRef.current;
      if (!stream || !recordingRef.current) return;
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      const parts: Blob[] = [];
      mr.ondataavailable = (e) => e.data.size > 0 && parts.push(e.data);
      mr.onstop = () => {
        const type = mr.mimeType || mime || "audio/webm";
        handleSegment(new Blob(parts, { type }), type);
        if (recordingRef.current) startSegment(mime);
      };
      mr.start();
      recorderRef.current = mr;
      setTimeout(() => {
        if (mr.state !== "inactive") mr.stop();
      }, SEGMENT_MS);
    },
    [handleSegment]
  );

  const startRecording = useCallback(async () => {
    setMicError(null);
    const mime = pickMime();
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setSupported(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      recordingRef.current = true;
      setRecording(true);
      startSegment(mime);
    } catch {
      setMicError("Microphone access was blocked. Enable it in your browser settings and try again.");
    }
  }, [startSegment]);

  const stopRecording = useCallback(() => {
    recordingRef.current = false;
    setRecording(false);
    try {
      if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    } catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setTimeout(() => processQueue(), 400);
  }, [processQueue]);

  // Stop recording if the modal is closed.
  useEffect(() => {
    if (!sessionId && recordingRef.current) stopRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const onPickPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    for (const f of files) {
      if (!f.type.startsWith("image/") || !sessionId) continue;
      const id = await addPhoto({ sessionId, blob: f, createdAt: Date.now() });
      setPhotos((p) => [...p, { id: id as number, url: URL.createObjectURL(f) }]);
    }
  };

  const removePhoto = async (id: number) => {
    await deletePhoto(id).catch(() => {});
    setPhotos((p) => {
      const gone = p.find((x) => x.id === id);
      if (gone) URL.revokeObjectURL(gone.url);
      return p.filter((x) => x.id !== id);
    });
  };

  const transcriptText = segments.map((s) => s.text).join(" ").trim();

  const generateSummary = async () => {
    if (!sessionId || transcriptText.length < 40) return;
    setSummarizing(true);
    try {
      const r = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcriptText, sessionId }),
      });
      if (r.status === 401) {
        openOnboarding(null);
        return;
      }
      if (!r.ok) throw new Error();
      const d = await r.json();
      setSummary(d.highlights);
      setShared(false);
      persist({ summary: d.highlights });
    } catch {
      pushToast("Couldn't generate highlights — try again in a moment.", "error");
    } finally {
      setSummarizing(false);
    }
  };

  // Contribute this summary to the shared, combined session summary everyone can see.
  const shareToSession = async () => {
    if (!sessionId || !summary || sharing) return;
    setSharing(true);
    try {
      const r = await fetch("/api/session-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, highlights: summary, name: attendee?.name }),
      });
      if (r.status === 401) {
        openOnboarding(null);
        return;
      }
      if (!r.ok) throw new Error();
      setShared(true);
      setSummaryReload((n) => n + 1);
      pushToast("Shared with the session — thanks for helping everyone! 🙌", "success");
    } catch {
      pushToast("Couldn't share right now — try again in a moment.", "error");
    } finally {
      setSharing(false);
    }
  };

  const speakerLabel = (id: string) => {
    if (!speakerMap.current.has(id)) speakerMap.current.set(id, speakerMap.current.size + 1);
    return speakerMap.current.get(id);
  };
  const multiSpeaker = new Set(segments.map((s) => s.speaker)).size > 1;

  const copyNotes = async () => {
    if (!session) return;
    let md = `# ${session.title}\n${speakerLine(session)} · ${formatTimeRange(session)}\n\n`;
    if (summary) {
      md += `## Highlights\n${summary.tldr}\n\n`;
      if (summary.keyPoints.length) md += summary.keyPoints.map((k) => `- ${k}`).join("\n") + "\n\n";
      if (summary.actionItems.length)
        md += `### Action items\n` + summary.actionItems.map((k) => `- [ ] ${k}`).join("\n") + "\n\n";
      if (summary.resources.length)
        md += `### Resources\n` + summary.resources.map((k) => `- ${k}`).join("\n") + "\n\n";
    }
    md += `## Transcript\n${transcriptText || "(none yet)"}\n`;
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      pushToast("Couldn't copy — select and copy manually.", "warn");
    }
  };

  if (!sessionId || !session) return null;
  const track = TRACKS[session.track];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={() => !recording && closeNotes()}
    >
      <div
        className="flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/12 bg-[#0a1f4d] shadow-2xl animate-fade-up sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        style={{ borderTop: `4px solid ${track.color}` }}
      >
        {/* header */}
        <div className="flex items-start justify-between p-4 pb-3">
          <div className="pr-3">
            <div className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-lime">
              <Mic width={12} height={12} /> Record &amp; transcribe <span className="text-white/30">· beta</span>
            </div>
            <h2 className="text-base font-bold leading-snug text-white">{session.title}</h2>
            <p className="mt-0.5 text-xs text-white/50">
              {formatTimeRange(session)} · {ROOMS[session.room].label}
            </p>
          </div>
          <button
            onClick={() => !recording && closeNotes()}
            disabled={recording}
            className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            <X width={20} height={20} />
          </button>
        </div>

        {/* controls */}
        <div className="border-y border-white/10 bg-white/[0.02] px-4 py-3">
          {!supported ? (
            <p className="text-sm text-amber-200">
              Recording isn&apos;t supported in this browser. Try Chrome or Safari.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                {!recording ? (
                  <button onClick={startRecording} className="btn-lime flex-1 py-3">
                    <Mic width={18} height={18} /> Start recording
                  </button>
                ) : (
                  <button onClick={stopRecording} className="btn flex-1 bg-rose-500 py-3 text-white hover:bg-rose-600">
                    <Square width={16} height={16} /> Stop
                  </button>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-ghost py-3"
                  title="Snap a slide or QR code"
                >
                  <Camera width={18} height={18} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  className="hidden"
                  onChange={onPickPhotos}
                />
              </div>

              <div className="mt-2.5 flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-white/65">
                  <input
                    type="checkbox"
                    checked={isolate}
                    onChange={(e) => setIsolate(e.target.checked)}
                    className="h-4 w-4 accent-lime"
                  />
                  Loud room — clean audio first
                </label>
                <div className="flex items-center gap-2 text-xs">
                  {recording && (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-rose-300">
                      <span className="h-2 w-2 animate-pulse-dot rounded-full bg-rose-400" /> recording
                    </span>
                  )}
                  {(busyTranscribe || queue > 0) && (
                    <span className="text-white/50">
                      {offline ? "offline · " : "transcribing · "}
                      {queue} queued
                    </span>
                  )}
                </div>
              </div>
              {micError && <p className="mt-2 text-xs text-rose-300">{micError}</p>}
            </>
          )}
        </div>

        {/* At-capacity notice — graceful fallback */}
        {atCapacity && (
          <div className="border-b border-amber-400/20 bg-amber-500/10 px-4 py-3">
            <div className="flex items-start gap-2">
              <Warn width={16} height={16} className="mt-0.5 shrink-0 text-amber-300" />
              <div className="text-xs leading-relaxed text-amber-100/90">
                <span className="font-semibold">Live transcription is at capacity right now.</span> Your audio
                is still being captured and will transcribe as soon as a slot frees — nothing is lost. Others in
                this room are recording too, and a <span className="font-semibold">combined summary</span> is
                shared below. If you get a transcript, please tap <span className="font-semibold">Share</span> to
                help everyone.
              </div>
            </div>
          </div>
        )}

        {/* body */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Combined summary from everyone recording this session */}
          <div className="mb-4">
            <SessionSummary
              sessionId={sessionId}
              reloadToken={summaryReload}
              emptyHint={
                atCapacity
                  ? "No shared summary yet — it'll appear here as soon as someone shares theirs."
                  : undefined
              }
            />
          </div>

          {/* photos */}
          {photos.length > 0 && (
            <div className="mb-4">
              <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-white/40">
                Snaps ({photos.length}) · saved on your device
              </div>
              <div className="flex flex-wrap gap-2">
                {photos.map((p) => (
                  <div key={p.id} className="group relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt="snap"
                      className="h-20 w-20 cursor-pointer rounded-lg object-cover"
                      onClick={() => window.open(p.url, "_blank")}
                    />
                    <button
                      onClick={() => removePhoto(p.id)}
                      className="absolute -right-1.5 -top-1.5 rounded-full bg-rose-500 p-1 text-white opacity-0 transition group-hover:opacity-100"
                    >
                      <Trash width={11} height={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* summary */}
          {summary && (
            <div className="mb-4 rounded-2xl border border-lime/25 bg-lime/[0.06] p-4">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-lime">
                <Sparkle width={13} height={13} /> Highlights
              </div>
              {summary.tldr && <p className="text-sm text-white/85">{summary.tldr}</p>}
              {summary.keyPoints.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm text-white/75">
                  {summary.keyPoints.map((k, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-lime">•</span>
                      {k}
                    </li>
                  ))}
                </ul>
              )}
              {summary.actionItems.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-white/60">Action items</div>
                  <ul className="mt-1 space-y-1 text-sm text-white/75">
                    {summary.actionItems.map((k, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-lime">☐</span>
                        {k}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {summary.resources.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-white/60">Mentioned</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {summary.resources.map((k, i) => (
                      <span key={i} className="chip border border-white/15 bg-white/5 text-white/70">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* transcript */}
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-white/40">Transcript</div>
          {segments.length === 0 ? (
            <p className="rounded-xl bg-white/[0.03] p-4 text-center text-sm text-white/45">
              {recording
                ? "Listening… your transcript will appear here as it processes."
                : "Tap Start recording to capture this session. You can also snap slides & QR codes — no more frantic notes."}
            </p>
          ) : (
            <div className="space-y-2 text-sm leading-relaxed">
              {segments.map((s, i) => (
                <p key={i} className="text-white/85">
                  {multiSpeaker && (
                    <span className="mr-1.5 rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold text-white/60">
                      Speaker {speakerLabel(s.speaker)}
                    </span>
                  )}
                  {s.text}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* footer actions */}
        <div className="space-y-2 border-t border-white/10 p-3">
          <div className="flex items-center gap-2">
            <button
              onClick={generateSummary}
              disabled={summarizing || transcriptText.length < 40}
              className="btn-lime flex-1 py-2.5"
            >
              <Sparkle width={16} height={16} />
              {summarizing ? "Thinking…" : summary ? "Regenerate highlights" : "Generate highlights"}
            </button>
            <button onClick={copyNotes} className="btn-ghost py-2.5" title="Copy notes">
              {copied ? <Check width={16} height={16} /> : <Copy width={16} height={16} />}
            </button>
          </div>
          {summary && (
            <button
              onClick={shareToSession}
              disabled={sharing || shared}
              className="btn-going w-full py-2.5"
            >
              <Users width={16} height={16} />
              {shared ? "Shared with the session ✓" : sharing ? "Sharing…" : "Share with this session"}
            </button>
          )}
        </div>
        <p className="px-4 pb-3 text-center text-[10px] leading-relaxed text-white/30">
          Audio is sent securely for transcription, then discarded. Photos &amp; transcript stay on your device.
        </p>
      </div>
    </div>
  );
}
