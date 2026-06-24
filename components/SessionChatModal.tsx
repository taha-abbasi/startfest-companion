"use client";

import React, { useEffect } from "react";
import { useApp } from "@/components/store";
import { getSession, formatTimeRange, ROOMS, TRACKS } from "@/data/schedule";
import { ChatPanel } from "@/components/ChatPanel";
import { SessionSummary } from "@/components/SessionSummary";
import { X } from "@/components/icons";

export function SessionChatModal() {
  const { chatSessionId, closeChat } = useApp();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeChat();
    if (chatSessionId) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chatSessionId, closeChat]);

  if (!chatSessionId) return null;
  const session = getSession(chatSessionId);
  if (!session) return null;
  const track = TRACKS[session.track];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={closeChat}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-white/12 bg-[#0a1f4d] shadow-2xl animate-fade-up sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        style={{ borderTop: `4px solid ${track.color}` }}
      >
        <div className="flex items-start justify-between p-4 pb-3">
          <div className="pr-3">
            <span
              className="chip mb-1.5"
              style={{ background: track.color, color: track.ink === "dark" ? "#08153a" : "#fff" }}
            >
              {track.label}
            </span>
            <h2 className="text-base font-bold leading-snug text-white">{session.title}</h2>
            <p className="mt-0.5 text-xs text-white/50">
              {formatTimeRange(session)} · {ROOMS[session.room].label} · Chat &amp; notes
            </p>
          </div>
          <button onClick={closeChat} className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white">
            <X width={20} height={20} />
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-3 pb-3">
          <SessionSummary sessionId={session.id} />
          <ChatPanel
            room={session.id}
            placeholder="Share a note, link, or question…"
            heightClass="h-[58vh]"
          />
        </div>
      </div>
    </div>
  );
}
