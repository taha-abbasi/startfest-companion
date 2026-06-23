"use client";

import React, { useMemo } from "react";
import {
  SESSIONS,
  DAYS,
  CONFERENCE,
  sessionStart,
  sessionEnd,
  type Session,
} from "@/data/schedule";
import { SessionCard } from "@/components/SessionCard";
import { useApp } from "@/components/store";
import { Bolt, Clock, ArrowRight, Calendar } from "@/components/icons";

const ROOM_ORDER: Record<string, number> = {
  mainstage: 0, start: 1, ignition: 2, accelerator: 3, resource: 4, hackathon: 5,
};

function bySchedule(a: Session, b: Session) {
  return (
    sessionStart(a).getTime() - sessionStart(b).getTime() ||
    (ROOM_ORDER[a.room] ?? 9) - (ROOM_ORDER[b.room] ?? 9)
  );
}

export function UpNext({ now, onSeeFull }: { now: number; onSeeFull: () => void }) {
  const { setView } = useApp();

  const { liveNow, nextBlock, laterCount, whenLabel } = useMemo(() => {
    const items = SESSIONS.filter((s) => s.kind !== "break");
    const live = items
      .filter((s) => sessionStart(s).getTime() <= now && now < sessionEnd(s).getTime())
      .sort(bySchedule);
    const upcoming = items.filter((s) => sessionStart(s).getTime() > now).sort(bySchedule);

    let block: Session[] = [];
    let later = 0;
    let label = "";
    if (upcoming.length) {
      const nextMs = sessionStart(upcoming[0]).getTime();
      block = upcoming.filter((s) => sessionStart(s).getTime() === nextMs);
      later = upcoming.length - block.length;

      const todayDenver = new Intl.DateTimeFormat("en-CA", { timeZone: CONFERENCE.tz }).format(
        new Date(now)
      );
      const sameDay = block[0].date === todayDenver;
      const dm = DAYS.find((d) => d.date === block[0].date);
      const time = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: CONFERENCE.tz,
      }).format(new Date(nextMs));
      const mins = Math.round((nextMs - now) / 60000);
      if (mins >= 0 && mins < 90) label = mins <= 1 ? "starting now" : `in ${mins} min`;
      else if (sameDay) label = `at ${time}`;
      else label = `${dm?.weekday ?? ""} · ${time}`;
    }
    return { liveNow: live, nextBlock: block, laterCount: later, whenLabel: label };
  }, [now]);

  const wrapped = liveNow.length === 0 && nextBlock.length === 0;

  const SeeFull = (
    <button
      onClick={onSeeFull}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-sm font-semibold text-white/85 transition hover:bg-white/10"
    >
      See full schedule
      <ArrowRight width={15} height={15} />
    </button>
  );

  if (wrapped) {
    return (
      <section className="mb-6">
        <div className="card p-6 text-center">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-lime/15 text-lime">
            <Bolt width={20} height={20} />
          </div>
          <h2 className="text-lg font-bold text-white">That&apos;s a wrap on StartFest 🤠</h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-white/55">
            Thanks for being here. You can still browse the full agenda or revisit your schedule.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {SeeFull}
            <button onClick={() => setView("agenda")} className="btn-lime">
              <Calendar width={16} height={16} /> My agenda
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bolt width={16} height={16} className="text-lime" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            {liveNow.length ? "Now & up next" : "Up next"}
          </h2>
        </div>
        <div className="hidden sm:block">{SeeFull}</div>
      </div>

      {liveNow.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-2 px-1 text-[12px] font-bold uppercase tracking-wider text-lime">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-lime" />
            </span>
            Happening now
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {liveNow.map((s) => (
              <SessionCard key={s.id} session={s} now={now} />
            ))}
          </div>
        </div>
      )}

      {nextBlock.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5 px-1 text-[12px] font-bold uppercase tracking-wider text-white/55">
            <Clock width={13} height={13} />
            Up next <span className="text-lime">· {whenLabel}</span>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {nextBlock.map((s) => (
              <SessionCard key={s.id} session={s} now={now} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 sm:hidden">{SeeFull}</div>
      {laterCount > 0 && (
        <p className="mt-3 px-1 text-center text-xs text-white/40 sm:text-left">
          + {laterCount} more session{laterCount === 1 ? "" : "s"} coming up — see the full schedule.
        </p>
      )}
    </section>
  );
}
