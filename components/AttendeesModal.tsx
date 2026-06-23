"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/components/store";
import { getSession, formatTimeRange, ROOMS, TRACKS } from "@/data/schedule";
import { X, Users, Plus, Check, MessageCircle, Mic } from "@/components/icons";

interface AttData {
  total: number;
  names: string[];
  hiddenCount: number;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "·";
}

const AVATAR_BG = ["#c6f23e", "#19c9b6", "#4fb8f0", "#8b7bf0", "#c06af0", "#ec5b9e", "#f59e6b"];

export function AttendeesModal() {
  const { attendeesFor, closeAttendees, isGoing, toggle, busyId, openChat, openNotes } = useApp();
  const [data, setData] = useState<AttData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (attendeesFor) {
      setData(null);
      setLoading(true);
      fetch(`/api/sessions/${encodeURIComponent(attendeesFor)}/attendees`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (active) setData({ total: d.total ?? 0, names: d.names ?? [], hiddenCount: d.hiddenCount ?? 0 });
        })
        .catch(() => active && setData({ total: 0, names: [], hiddenCount: 0 }))
        .finally(() => active && setLoading(false));
    }
    return () => {
      active = false;
    };
  }, [attendeesFor]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAttendees();
    if (attendeesFor) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [attendeesFor, closeAttendees]);

  if (!attendeesFor) return null;
  const session = getSession(attendeesFor);
  if (!session) return null;
  const track = TRACKS[session.track];
  const going = isGoing(session.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={closeAttendees}
    >
      <div
        className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/12 bg-[#0a1f4d] shadow-2xl animate-fade-up sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5" style={{ borderTop: `4px solid ${track.color}` }}>
          <div className="mb-3 flex items-start justify-between">
            <div className="pr-3">
              <span
                className="chip mb-2"
                style={{ background: track.color, color: track.ink === "dark" ? "#08153a" : "#fff" }}
              >
                {track.label}
              </span>
              <h2 className="text-lg font-bold leading-snug text-white">{session.title}</h2>
              <p className="mt-1 text-sm text-white/55">
                {formatTimeRange(session)} · {ROOMS[session.room].label}
              </p>
            </div>
            <button onClick={closeAttendees} className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white">
              <X width={20} height={20} />
            </button>
          </div>

          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Users width={16} height={16} className="text-lime" />
            {loading ? "Counting…" : data ? `${data.total} going` : "—"}
          </div>

          {loading && (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-white/10" />
              ))}
            </div>
          )}

          {!loading && data && data.total === 0 && (
            <p className="rounded-xl bg-white/[0.04] p-4 text-center text-sm text-white/55">
              No one&apos;s added this yet. Be the first to show interest!
            </p>
          )}

          {!loading && data && data.names.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.names.map((n, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] py-1 pl-1 pr-3"
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-extrabold text-navy-900"
                    style={{ background: AVATAR_BG[i % AVATAR_BG.length] }}
                  >
                    {initials(n)}
                  </span>
                  <span className="text-sm text-white/85">{n}</span>
                </span>
              ))}
            </div>
          )}

          {!loading && data && data.hiddenCount > 0 && (
            <p className="mt-3 text-xs text-white/45">
              + {data.hiddenCount} more attending privately
            </p>
          )}

          <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
            <button
              onClick={() => toggle(session.id)}
              disabled={busyId === session.id}
              className={`${going ? "btn-going" : "btn-lime"} w-full py-3`}
            >
              {going ? <Check width={18} height={18} /> : <Plus width={18} height={18} />}
              {going ? "You're going — tap to remove" : "Add me to this session"}
            </button>
            <div className="flex gap-2">
              <button onClick={() => openChat(session.id)} className="btn-ghost flex-1 py-3">
                <MessageCircle width={17} height={17} /> Chat
              </button>
              <button onClick={() => openNotes(session.id)} className="btn-ghost flex-1 py-3">
                <Mic width={17} height={17} /> Record &amp; notes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
