"use client";

import React, { useMemo } from "react";
import {
  SESSIONS,
  TRACKS,
  ROOMS,
  DAYS,
  formatStart,
  type Session,
} from "@/data/schedule";
import { useApp } from "@/components/store";
import { Users, Plus, Check, Sparkle } from "@/components/icons";

const MAX = 6;

export function PopularSessions() {
  const { counts, isGoing, toggle, busyId, openAttendees } = useApp();

  const popular = useMemo(() => {
    return SESSIONS.filter((s) => s.kind === "session" || s.kind === "activity")
      .map((s) => ({ s, n: counts[s.id] ?? 0 }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)
      .slice(0, MAX);
  }, [counts]);

  if (popular.length === 0) return null;

  const dayLabel = (s: Session) => DAYS.find((d) => d.day === s.day)?.label ?? "";

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2 px-1">
        <Sparkle width={16} height={16} className="text-lime" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">Most popular right now</h2>
        <span className="text-xs text-white/40">across both days</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {popular.map(({ s, n }, i) => {
          const track = TRACKS[s.track];
          const going = isGoing(s.id);
          return (
            <button
              key={s.id}
              onClick={() => openAttendees(s.id)}
              className="card card-hover group flex items-center gap-3 p-3 text-left"
              style={{ borderLeft: `4px solid ${track.color}` }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black"
                style={{ background: track.color, color: track.ink === "dark" ? "#08153a" : "#fff" }}
              >
                {i + 1}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-bold text-white">{s.title}</span>
                <span className="mt-0.5 block truncate text-xs text-white/50">
                  {dayLabel(s)} · {formatStart(s)} · {ROOMS[s.room].label}
                </span>
                <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-lime">
                  <Users width={13} height={13} />
                  {n} going
                </span>
              </span>

              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(s.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    toggle(s.id);
                  }
                }}
                aria-disabled={busyId === s.id}
                className={`${going ? "btn-going" : "btn-lime"} shrink-0 px-3 py-2`}
              >
                {going ? <Check width={15} height={15} /> : <Plus width={15} height={15} />}
                <span className="hidden sm:inline">{going ? "Going" : "Add"}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
