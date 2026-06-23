"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/store";
import { Send } from "@/components/icons";

interface Msg {
  id: string;
  name: string;
  text: string;
  ts: number;
  mine: boolean;
  pending?: boolean;
  failed?: boolean;
}

const AVATAR_BG = ["#c6f23e", "#19c9b6", "#4fb8f0", "#8b7bf0", "#c06af0", "#ec5b9e", "#f59e6b"];
function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_BG[h % AVATAR_BG.length];
}
function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "·";
}
function relTime(ts: number) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return new Date(ts).toLocaleDateString();
}

export function ChatPanel({
  room,
  placeholder = "Say something…",
  heightClass = "h-[60vh]",
}: {
  room: string;
  placeholder?: string;
  heightClass?: string;
}) {
  const { attendee, openOnboarding, pushToast } = useApp();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [offline, setOffline] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const lastId = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  const merge = useCallback((incoming: Msg[]) => {
    if (!incoming.length) return;
    setMsgs((prev) => {
      const ids = new Set(prev.map((m) => m.id));
      const fresh = incoming.filter((m) => !ids.has(m.id));
      if (!fresh.length) return prev;
      return [...prev, ...fresh];
    });
    lastId.current = incoming[incoming.length - 1].id;
  }, []);

  // initial load
  useEffect(() => {
    let active = true;
    fetch(`/api/chat?room=${encodeURIComponent(room)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        const list: Msg[] = d.messages ?? [];
        setMsgs(list);
        if (list.length) lastId.current = list[list.length - 1].id;
        setOffline(false);
      })
      .catch(() => active && setOffline(true))
      .finally(() => {
        if (active) {
          setLoaded(true);
          setTimeout(() => scrollToBottom(false), 50);
        }
      });
    return () => {
      active = false;
    };
  }, [room, scrollToBottom]);

  // poll for new messages
  useEffect(() => {
    let stop = false;
    const tick = async () => {
      if (stop || document.hidden) return;
      try {
        const q = lastId.current ? `&after=${lastId.current}` : "";
        const r = await fetch(`/api/chat?room=${encodeURIComponent(room)}${q}`, { cache: "no-store" });
        if (!r.ok) throw new Error();
        const d = await r.json();
        merge(d.messages ?? []);
        setOffline(false);
      } catch {
        setOffline(true);
      }
    };
    const iv = setInterval(tick, 3500);
    const onVis = () => !document.hidden && tick();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop = true;
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [room, merge]);

  // autoscroll on new messages if user is near the bottom
  useEffect(() => {
    if (atBottom.current) scrollToBottom();
  }, [msgs, scrollToBottom]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    if (!attendee) {
      openOnboarding(null);
      return;
    }
    const tempId = "tmp-" + Date.now();
    const optimistic: Msg = {
      id: tempId,
      name: attendee.name,
      text,
      ts: Date.now(),
      mine: true,
      pending: true,
    };
    setMsgs((p) => [...p, optimistic]);
    setInput("");
    atBottom.current = true;
    setSending(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room, text }),
      });
      if (r.status === 401) {
        setMsgs((p) => p.filter((m) => m.id !== tempId));
        openOnboarding(null);
        return;
      }
      if (r.status === 429) {
        setMsgs((p) => p.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)));
        pushToast("Whoa there — one sec between messages.", "warn");
        return;
      }
      if (!r.ok) throw new Error();
      const d = await r.json();
      const real: Msg = d.message;
      setMsgs((p) => p.map((m) => (m.id === tempId ? real : m)));
      lastId.current = real.id;
      setOffline(false);
    } catch {
      setMsgs((p) => p.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)));
      setOffline(true);
    } finally {
      setSending(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className={`flex ${heightClass} flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]`}>
      {offline && (
        <div className="bg-amber-500/15 px-4 py-1.5 text-center text-xs font-medium text-amber-200">
          Reconnecting… your messages will send when you&apos;re back online.
        </div>
      )}

      {/* messages */}
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 space-y-3 overflow-y-auto p-4">
        {!loaded && <div className="py-8 text-center text-sm text-white/40">Loading chat…</div>}
        {loaded && msgs.length === 0 && (
          <div className="py-10 text-center text-sm text-white/50">
            No messages yet. Be the first to say hi 👋
          </div>
        )}
        {msgs.map((m) => (
          <div key={m.id} className={`flex gap-2.5 ${m.mine ? "flex-row-reverse" : ""}`}>
            {!m.mine && (
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-navy-900"
                style={{ background: colorFor(m.name) }}
              >
                {initials(m.name)}
              </span>
            )}
            <div className={`max-w-[78%] ${m.mine ? "items-end text-right" : ""}`}>
              <div className="mb-0.5 flex items-center gap-1.5 text-[11px] text-white/40">
                {!m.mine && <span className="font-semibold text-white/70">{m.name}</span>}
                <span>{m.pending ? "sending…" : m.failed ? "failed" : relTime(m.ts)}</span>
              </div>
              <div
                className={`inline-block whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm ${
                  m.mine
                    ? "bg-lime/90 text-navy-900"
                    : "bg-white/[0.07] text-white"
                } ${m.failed ? "opacity-60 ring-1 ring-rose-400/50" : ""} ${m.pending ? "opacity-70" : ""}`}
              >
                {m.text}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* composer */}
      <div className="border-t border-white/10 p-2.5">
        {attendee ? (
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={1}
              maxLength={500}
              placeholder={placeholder}
              className="max-h-28 min-h-[44px] flex-1 resize-none rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:border-lime/50"
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              className="btn-lime h-11 w-11 shrink-0 !px-0"
              aria-label="Send"
            >
              <Send width={18} height={18} />
            </button>
          </div>
        ) : (
          <button onClick={() => openOnboarding(null)} className="btn-lime w-full py-3">
            Add your name to join the chat
          </button>
        )}
      </div>
    </div>
  );
}
