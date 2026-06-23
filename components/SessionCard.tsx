"use client";

import React from "react";
import {
  type Session,
  TRACKS,
  ROOMS,
  formatTimeRange,
  speakerLine,
  sessionStart,
  sessionEnd,
} from "@/data/schedule";
import { useApp } from "@/components/store";
import { AddToCalendar } from "@/components/AddToCalendar";
import { Plus, Check, Users, Warn, Clock } from "@/components/icons";

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function SessionCard({ session, now }: { session: Session; now: number }) {
  const { isGoing, countFor, toggle, busyId, openAttendees, conflictIds } = useApp();
  const track = TRACKS[session.track];
  const room = ROOMS[session.room];
  const going = isGoing(session.id);
  const count = countFor(session.id);
  const busy = busyId === session.id;
  const speakers = speakerLine(session);
  const inConflict = going && conflictIds.has(session.id);

  const start = sessionStart(session).getTime();
  const end = sessionEnd(session).getTime();
  const live = now >= start && now < end;
  const past = now >= end;

  return (
    <div
      className={`card card-hover relative overflow-hidden p-4 sm:p-[18px] animate-fade-up ${
        past ? "opacity-[0.62]" : ""
      }`}
      style={{ borderLeft: `4px solid ${track.color}` }}
    >
      {/* faint track glow in the corner */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl"
        style={{ background: hexToRgba(track.color, 0.18) }}
      />

      <div className="relative">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className="chip"
            style={{
              background: track.color,
              color: track.ink === "dark" ? "#08153a" : "#fff",
            }}
          >
            {track.label}
          </span>
          {session.room !== "mainstage" && (
            <span className="chip border border-white/15 bg-white/5 text-white/70">
              {room.letter ? `${room.letter} · ` : ""}
              {room.label}
            </span>
          )}
          {live && (
            <span className="chip bg-lime/15 text-lime">
              <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse-dot" />
              Live now
            </span>
          )}
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-white/60">
            <Clock width={13} height={13} />
            {formatTimeRange(session)}
          </span>
        </div>

        <h3 className="text-[17px] font-bold leading-snug text-white">{session.title}</h3>
        {speakers && <p className="mt-1 text-sm text-white/65">{speakers}</p>}
        {session.note && <p className="mt-1 text-[13px] italic text-white/45">{session.note}</p>}

        {inConflict && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 px-2.5 py-1 text-[12px] font-semibold text-rose-200">
            <Warn width={13} height={13} />
            Overlaps another session you picked
          </div>
        )}

        <div className="mt-3.5 flex items-center gap-2">
          <button
            onClick={() => openAttendees(session.id)}
            className="group inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-sm text-white/70 transition hover:text-white"
            title="See who's going"
          >
            <Users width={15} height={15} />
            {count > 0 ? (
              <span className="font-semibold text-white/90">
                {count} going
              </span>
            ) : (
              <span className="text-white/50">Be the first</span>
            )}
          </button>

          <div className="ml-auto flex items-center gap-2">
            <AddToCalendar session={session} />
            <button
              onClick={() => toggle(session.id)}
              disabled={busy}
              className={going ? "btn-going" : "btn-lime"}
            >
              {going ? <Check width={16} height={16} /> : <Plus width={16} height={16} />}
              {going ? "Going" : "Add"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
