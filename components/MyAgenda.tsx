"use client";

import React, { useMemo } from "react";
import { SESSIONS, DAYS, sessionStart, getSession, findConflicts, type Session } from "@/data/schedule";
import { useApp } from "@/components/store";
import { SessionCard } from "@/components/SessionCard";
import { useNow } from "@/components/useNow";
import { Calendar, Warn, Share, Pencil, Sparkle } from "@/components/icons";

export function MyAgenda() {
  const { mySet, attendee, editProfile, setView, openOnboarding, pushToast } = useApp();
  const now = useNow();

  const mine = useMemo(
    () =>
      [...mySet]
        .map((id) => getSession(id))
        .filter((s): s is Session => !!s)
        .sort((a, b) => sessionStart(a).getTime() - sessionStart(b).getTime()),
    [mySet]
  );

  const conflictPairs = useMemo(() => findConflicts([...mySet]), [mySet]);

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const text = "Building my StartFest 2026 schedule — see the agenda & who's going:";
    try {
      if (navigator.share) {
        await navigator.share({ title: "StartFest 2026", text, url });
      } else {
        await navigator.clipboard.writeText(url);
        pushToast("Link copied to clipboard.", "success");
      }
    } catch {
      /* user cancelled */
    }
  };

  if (mine.length === 0) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-lime/15 text-lime">
          <Sparkle width={22} height={22} />
        </div>
        <h2 className="text-xl font-bold text-white">Your schedule is empty</h2>
        <p className="mt-2 text-sm text-white/60">
          Browse the agenda and tap <span className="font-semibold text-lime">Add</span> on any session. We&apos;ll
          watch for time conflicts and can email you a calendar invite with a reminder.
        </p>
        <button onClick={() => setView("schedule")} className="btn-lime mt-5">
          Browse the agenda
        </button>
      </div>
    );
  }

  return (
    <div className="pb-10">
      {/* Identity + actions */}
      <div className="card mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {attendee ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{attendee.name}</span>
                <button
                  onClick={editProfile}
                  className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-white"
                >
                  <Pencil width={12} height={12} /> edit
                </button>
              </div>
              <div className="truncate text-xs text-white/50">
                {attendee.email}
                {attendee.emailOptIn ? " · email reminders on" : " · email off"}
              </div>
            </>
          ) : (
            <button onClick={() => openOnboarding(null)} className="text-sm font-semibold text-lime">
              Add your name & email to save across devices →
            </button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={share} className="btn-ghost">
            <Share width={16} height={16} /> Share
          </button>
          <a href="/api/ics/me" className="btn-lime">
            <Calendar width={16} height={16} /> Add all to calendar
          </a>
        </div>
      </div>

      {/* Conflict banner */}
      {conflictPairs.length > 0 && (
        <div className="mb-5 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4">
          <div className="flex items-center gap-2 font-semibold text-rose-200">
            <Warn width={16} height={16} />
            {conflictPairs.length} time conflict{conflictPairs.length > 1 ? "s" : ""} on your schedule
          </div>
          <ul className="mt-2 space-y-1 text-sm text-rose-100/80">
            {conflictPairs.map(([a, b], i) => (
              <li key={i}>
                “{getSession(a)?.title}” overlaps “{getSession(b)?.title}”
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-rose-100/60">
            You can stay in both lists, but you&apos;ll have to pick one in the room. Remove one to clear the warning.
          </p>
        </div>
      )}

      {/* Sessions grouped by day */}
      {DAYS.map((d) => {
        const dayMine = mine.filter((s) => s.day === d.day);
        if (dayMine.length === 0) return null;
        return (
          <div key={d.day} className="mb-7">
            <div className="mb-3 flex items-center gap-3 px-1">
              <h3 className="text-sm font-bold uppercase tracking-wider text-lime">{d.label}</h3>
              <span className="text-sm text-white/50">
                {d.weekday}, June {d.date.slice(-2)} · {dayMine.length} session
                {dayMine.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {dayMine.map((s) => (
                <SessionCard key={s.id} session={s} now={now} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
