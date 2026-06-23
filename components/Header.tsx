"use client";

import React from "react";
import { useApp } from "@/components/store";
import { CONFERENCE } from "@/data/schedule";
import { MapPin, Pencil } from "@/components/icons";

function Logo() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 shadow-sm">
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <path d="M7 4 L20 12 L7 20 Z" fill="#0a2461" />
      </svg>
    </span>
  );
}

export function Header() {
  const { attendee, openOnboarding, editProfile } = useApp();

  return (
    <header className="px-4 pt-5">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo />
            <div className="leading-tight">
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-lime">
                {CONFERENCE.org}
              </div>
              <div className="text-sm font-extrabold text-white">
                {CONFERENCE.name} <span className="text-lime">{CONFERENCE.edition}</span>
              </div>
            </div>
          </div>

          {attendee ? (
            <button
              onClick={editProfile}
              className="group inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] py-1.5 pl-3 pr-2.5 text-sm text-white/90 transition hover:bg-white/10"
            >
              <span className="h-2 w-2 rounded-full bg-lime" />
              <span className="max-w-[120px] truncate font-semibold">
                {attendee.name.split(" ")[0]}
              </span>
              <Pencil width={13} height={13} className="text-white/40 group-hover:text-white/70" />
            </button>
          ) : (
            <button
              onClick={() => openOnboarding(null)}
              className="rounded-full border border-lime/40 bg-lime/10 px-3.5 py-1.5 text-sm font-semibold text-lime transition hover:bg-lime/15"
            >
              Add your name
            </button>
          )}
        </div>

        {/* Hero */}
        <div className="mt-6 sm:mt-8">
          <h1 className="text-[34px] font-black leading-[1.05] tracking-tight text-white sm:text-5xl">
            Your StartFest,
            <br />
            <span className="text-lime">all in one place.</span>
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/65">
            Browse the full agenda free. Tap <span className="font-semibold text-white">Add</span> to build your
            personal schedule, see who&apos;s going, catch time conflicts, and get a calendar reminder before each
            session.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-white/55">
            {["2 Days", "6 Tracks", "36 Sessions", "3 Rooms"].map((s, i) => (
              <React.Fragment key={s}>
                {i > 0 && <span className="text-white/25">·</span>}
                <span className="font-semibold text-white/80">{s}</span>
              </React.Fragment>
            ))}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-white/45">
            <MapPin width={13} height={13} />
            <span>{CONFERENCE.venue}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
