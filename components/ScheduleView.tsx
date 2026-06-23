"use client";

import React, { useMemo, useState } from "react";
import {
  SESSIONS,
  DAYS,
  TRACKS,
  type Session,
  type TrackId,
  sessionStart,
  formatStart,
  ROOMS,
} from "@/data/schedule";
import { SessionCard } from "@/components/SessionCard";
import { PopularSessions } from "@/components/PopularSessions";
import { useApp } from "@/components/store";
import { useNow } from "@/components/useNow";

const ROOM_ORDER: Record<string, number> = {
  mainstage: 0,
  start: 1,
  ignition: 2,
  accelerator: 3,
  resource: 4,
  hackathon: 5,
};

const LEGEND_TRACKS = Object.values(TRACKS).filter((t) => t.inLegend);

type Row =
  | { type: "break"; session: Session }
  | { type: "group"; key: string; time: string; sessions: Session[] };

function buildRows(day: 1 | 2, selected: Set<TrackId>): Row[] {
  const items = SESSIONS.filter((s) => s.day === day).filter((s) =>
    s.kind === "break" ? true : selected.size === 0 || selected.has(s.track)
  );
  items.sort(
    (a, b) =>
      sessionStart(a).getTime() - sessionStart(b).getTime() ||
      (ROOM_ORDER[a.room] ?? 9) - (ROOM_ORDER[b.room] ?? 9)
  );

  const rows: Row[] = [];
  let cur: { type: "group"; key: string; time: string; sessions: Session[] } | null = null;
  for (const s of items) {
    if (s.kind === "break") {
      cur = null;
      rows.push({ type: "break", session: s });
      continue;
    }
    const key = `${s.date}T${s.start}`;
    if (!cur || cur.key !== key) {
      cur = { type: "group", key, time: formatStart(s), sessions: [s] };
      rows.push(cur);
    } else {
      cur.sessions.push(s);
    }
  }
  return rows;
}

export function ScheduleView() {
  const { mySet } = useApp();
  const now = useNow();
  const [day, setDay] = useState<1 | 2>(() => {
    // default to the day in progress / upcoming, else day 1
    const t = Date.now();
    const d2 = DAYS[1];
    const d2start = new Date(`${d2.date}T00:00:00-06:00`).getTime();
    return t >= d2start ? 2 : 1;
  });
  const [selected, setSelected] = useState<Set<TrackId>>(new Set());

  const rows = useMemo(() => buildRows(day, selected), [day, selected]);
  const dayMeta = DAYS.find((d) => d.day === day)!;
  const myCountForDay = useMemo(
    () => SESSIONS.filter((s) => s.day === day && mySet.has(s.id)).length,
    [day, mySet]
  );

  const toggleTrack = (t: TrackId) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  return (
    <div>
      {/* Day tabs */}
      <div className="sticky top-0 z-20 -mx-4 mb-4 bg-gradient-to-b from-[#071a41] via-[#071a41]/95 to-transparent px-4 pb-3 pt-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {DAYS.map((d) => {
            const active = d.day === day;
            return (
              <button
                key={d.day}
                onClick={() => setDay(d.day)}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-left transition sm:flex-none sm:px-5 ${
                  active
                    ? "border-lime/50 bg-lime/10"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                }`}
              >
                <div className={`text-[11px] font-bold uppercase tracking-wider ${active ? "text-lime" : "text-white/50"}`}>
                  {d.label}
                </div>
                <div className="text-sm font-semibold text-white">
                  {d.weekday}{" "}
                  <span className="font-normal text-white/55">
                    Jun {d.date.slice(-2)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Track filter */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelected(new Set())}
            className={`chip border transition ${
              selected.size === 0
                ? "border-white/30 bg-white/15 text-white"
                : "border-white/10 bg-transparent text-white/55 hover:text-white"
            }`}
          >
            All tracks
          </button>
          {LEGEND_TRACKS.map((t) => {
            const on = selected.has(t.id);
            return (
              <button
                key={t.id}
                onClick={() => toggleTrack(t.id)}
                className="chip border transition"
                style={
                  on
                    ? { background: t.color, color: t.ink === "dark" ? "#08153a" : "#fff", borderColor: t.color }
                    : { borderColor: "rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.6)" }
                }
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: on ? (t.ink === "dark" ? "#08153a" : "#fff") : t.color }}
                />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Trending across both days */}
      <PopularSessions />

      {/* Day summary */}
      <div className="mb-4 flex items-center justify-between px-1 text-sm">
        <span className="text-white/55">
          {dayMeta.weekday}, June {dayMeta.date.slice(-2)}
        </span>
        {myCountForDay > 0 && (
          <span className="font-semibold text-lime">
            {myCountForDay} on your schedule
          </span>
        )}
      </div>

      {/* Rows */}
      <div className="space-y-5 pb-10">
        {rows.map((row) => {
          if (row.type === "break") {
            const s = row.session;
            return (
              <div key={s.id} className="flex items-center gap-3 px-1 py-1">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
                  {formatStart(s)} · {s.title}
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            );
          }
          return (
            <div key={row.key} className="grid grid-cols-1 gap-4 sm:grid-cols-[64px_1fr]">
              <div className="hidden pt-1.5 sm:block">
                <div className="text-right text-sm font-bold text-white/80">{row.time}</div>
              </div>
              <div
                className={`grid grid-cols-1 gap-3 ${
                  row.sessions.length > 1 ? "lg:grid-cols-2 xl:grid-cols-3" : ""
                }`}
              >
                {row.sessions.map((s) => (
                  <SessionCard key={s.id} session={s} now={now} />
                ))}
              </div>
            </div>
          );
        })}
        {rows.filter((r) => r.type === "group").length === 0 && (
          <div className="card p-8 text-center text-white/60">
            No sessions match this filter on {dayMeta.weekday}. Try another track.
          </div>
        )}
      </div>
    </div>
  );
}
