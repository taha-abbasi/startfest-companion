"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/store";
import {
  getSession,
  sessionStart,
  formatStart,
  ROOMS,
  DAYS,
  TRACKS,
  type Session,
} from "@/data/schedule";
import { X, Users, Search, XLogo, LinkedInLogo, Clock } from "@/components/icons";

interface Sloper {
  id: string;
  name: string;
  avatar: string | null;
  x: string | null;
  linkedin: string | null;
  sessionIds: string[];
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

function Avatar({ s, size }: { s: Sloper; size: number }) {
  if (s.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={s.avatar} alt={s.name} className="rounded-2xl object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span
      className="flex items-center justify-center rounded-2xl font-extrabold text-navy-900"
      style={{ width: size, height: size, background: colorFor(s.name), fontSize: size * 0.36 }}
    >
      {initials(s.name)}
    </span>
  );
}

export function Directory() {
  const { openAttendees, openOnboarding, attendee } = useApp();
  const [slopers, setSlopers] = useState<Sloper[] | null>(null);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Sloper | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/directory", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => active && setSlopers(d.slopers ?? []))
      .catch(() => active && setSlopers([]));
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!slopers) return [];
    const t = q.trim().toLowerCase();
    return t ? slopers.filter((s) => s.name.toLowerCase().includes(t)) : slopers;
  }, [slopers, q]);

  const sessionsOf = (s: Sloper): Session[] =>
    s.sessionIds
      .map((id) => getSession(id))
      .filter((x): x is Session => !!x && x.kind !== "break")
      .sort((a, b) => sessionStart(a).getTime() - sessionStart(b).getTime());

  return (
    <div className="pb-28">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime/15 text-lime">
          <Users width={18} height={18} />
        </span>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold text-white">Slopers</h1>
          <p className="text-xs text-white/50">
            {slopers ? `${slopers.length} attendees` : "Loading…"} · tap to see their schedule
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.05] px-3">
        <Search width={16} height={16} className="text-white/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Slopers by name…"
          className="w-full bg-transparent py-2.5 text-sm text-white placeholder-white/40 outline-none"
        />
      </div>

      {!attendee && (
        <button
          onClick={() => openOnboarding(null)}
          className="mb-4 w-full rounded-xl border border-lime/30 bg-lime/[0.08] px-4 py-3 text-sm font-semibold text-lime"
        >
          Add your name, photo & socials to join the directory →
        </button>
      )}

      {slopers === null ? (
        <div className="py-10 text-center text-sm text-white/40">Loading Slopers…</div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center text-sm text-white/55">
          {q ? "No Slopers match that search." : "No Slopers yet — be the first to join!"}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className="card card-hover flex flex-col items-center p-4 text-center"
            >
              <Avatar s={s} size={64} />
              <div className="mt-2 line-clamp-1 text-sm font-bold text-white">{s.name}</div>
              <div className="mt-0.5 text-xs text-white/50">
                {s.sessionIds.filter((id) => getSession(id)?.kind !== "break").length} sessions
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-white/40">
                {s.x && <XLogo width={13} height={13} />}
                {s.linkedin && <LinkedInLogo width={13} height={13} />}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Profile overlay */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/12 bg-[#0a1f4d] shadow-2xl animate-fade-up sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative p-5">
              <button
                onClick={() => setSelected(null)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X width={20} height={20} />
              </button>

              <div className="flex items-center gap-4">
                <Avatar s={selected} size={80} />
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-white">{selected.name}</h2>
                  <p className="text-sm text-white/50">
                    {sessionsOf(selected).length} sessions on their schedule
                  </p>
                  <div className="mt-2 flex gap-2">
                    {selected.x && (
                      <a
                        href={selected.x}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10"
                      >
                        <XLogo width={13} height={13} /> X
                      </a>
                    )}
                    {selected.linkedin && (
                      <a
                        href={selected.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10"
                      >
                        <LinkedInLogo width={13} height={13} /> LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-white/40">
                  Catch them at
                </div>
                {sessionsOf(selected).length === 0 ? (
                  <p className="rounded-xl bg-white/[0.03] p-4 text-center text-sm text-white/45">
                    Hasn&apos;t added any sessions yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sessionsOf(selected).map((s) => {
                      const track = TRACKS[s.track];
                      const day = DAYS.find((d) => d.day === s.day);
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            setSelected(null);
                            openAttendees(s.id);
                          }}
                          className="card card-hover flex w-full items-center gap-3 p-3 text-left"
                          style={{ borderLeft: `4px solid ${track.color}` }}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-bold text-white">{s.title}</div>
                            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-white/50">
                              <Clock width={12} height={12} />
                              {day?.label} · {formatStart(s)} · {ROOMS[s.room].label}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
