"use client";

import React, { useEffect, useRef, useState } from "react";
import { type Session } from "@/data/schedule";
import {
  sessionMeta,
  googleEventUrl,
  outlookEventUrl,
  office365EventUrl,
  yahooEventUrl,
  icsSessionPath,
  subscribeLinks,
} from "@/lib/calendarLinks";
import { Calendar, Check } from "@/components/icons";

// ── Small provider marks ─────────────────────────────────────────────────────
function Brand({ kind }: { kind: string }) {
  const box = "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg";
  switch (kind) {
    case "google":
      return (
        <span className={`${box} bg-white`}>
          <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
            <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
            <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
            <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34A22 22 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z" />
            <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
          </svg>
        </span>
      );
    case "apple":
      return (
        <span className={`${box} bg-white`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#111" aria-hidden>
            <path d="M16.36 12.78c.02 2.45 2.15 3.27 2.18 3.28-.02.06-.34 1.16-1.12 2.3-.67.98-1.37 1.95-2.47 1.97-1.08.02-1.43-.64-2.66-.64-1.24 0-1.62.62-2.64.66-1.06.04-1.87-1.06-2.55-2.04-1.38-2-2.44-5.65-1.02-8.12.7-1.22 1.96-2 3.33-2.02 1.04-.02 2.02.7 2.66.7.63 0 1.83-.87 3.08-.74.53.02 2 .21 2.95 1.61-.08.05-1.76 1.03-1.74 3.06M14.4 5.16c.56-.68.94-1.62.84-2.56-.81.03-1.79.54-2.37 1.22-.52.6-.97 1.56-.85 2.48.9.07 1.82-.46 2.38-1.14" />
          </svg>
        </span>
      );
    case "outlook":
      return <span className={`${box} bg-[#0A6ED1] text-[13px] font-black text-white`}>O</span>;
    case "m365":
      return (
        <span className={`${box} bg-white`}>
          <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
            <path fill="#F25022" d="M2 2h9.5v9.5H2z" />
            <path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z" />
            <path fill="#00A4EF" d="M2 12.5h9.5V22H2z" />
            <path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z" />
          </svg>
        </span>
      );
    case "yahoo":
      return <span className={`${box} bg-[#5F01D1] text-[13px] font-black text-white`}>Y!</span>;
    default:
      return (
        <span className={`${box} bg-lime/20 text-lime`}>
          <Calendar width={15} height={15} />
        </span>
      );
  }
}

interface Item {
  key: string;
  label: string;
  sub?: string;
  href: string;
  brand: string;
  newTab?: boolean;
}

export function AddToCalendar({
  session,
  agenda,
  feedToken,
  variant = "icon",
}: {
  session?: Session;
  agenda?: boolean;
  feedToken?: string | null;
  variant?: "icon" | "button";
}) {
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  let items: Item[] = [];
  let heading = "Add to calendar";

  if (session) {
    const m = sessionMeta(session, origin);
    items = [
      { key: "apple", label: "Apple Calendar", href: icsSessionPath(session), brand: "apple" },
      { key: "google", label: "Google Calendar", href: googleEventUrl(m), brand: "google", newTab: true },
      { key: "outlook", label: "Outlook.com", href: outlookEventUrl(m), brand: "outlook", newTab: true },
      { key: "m365", label: "Microsoft 365", href: office365EventUrl(m), brand: "m365", newTab: true },
      { key: "yahoo", label: "Yahoo", href: yahooEventUrl(m), brand: "yahoo", newTab: true },
      { key: "ics", label: "Download .ics file", sub: "Any other calendar", href: icsSessionPath(session), brand: "ics" },
    ];
  } else if (agenda) {
    heading = "Add your agenda";
    const s = subscribeLinks(origin, feedToken ?? null);
    items = [
      { key: "gsub", label: "Google Calendar", sub: "Subscribe — auto-updates", href: s.google, brand: "google", newTab: true },
      { key: "asub", label: "Apple / iPhone", sub: "Subscribe — auto-updates", href: s.webcal, brand: "apple" },
      { key: "dl", label: "Download .ics file", sub: "One-time, all sessions", href: s.icsDownload, brand: "ics" },
    ];
  }

  const trigger =
    variant === "button" ? (
      <button onClick={() => setOpen((v) => !v)} className="btn-lime">
        <Calendar width={16} height={16} /> Add to calendar
      </button>
    ) : (
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost px-2.5 py-2"
        title="Add to calendar"
        aria-label="Add to calendar"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Calendar width={16} height={16} />
      </button>
    );

  return (
    <div className="relative" ref={ref}>
      {trigger}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-white/12 bg-[#0a1f4d] p-1.5 shadow-2xl animate-fade-up"
          >
            <div className="flex items-center gap-2 px-2.5 py-2 text-[11px] font-bold uppercase tracking-wider text-white/40">
              <Check width={12} height={12} className="text-lime" />
              {heading}
            </div>
            {items.map((it) => (
              <a
                key={it.key}
                href={it.href}
                target={it.newTab ? "_blank" : undefined}
                rel={it.newTab ? "noopener noreferrer" : undefined}
                onClick={() => setOpen(false)}
                role="menuitem"
                className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-white/[0.07]"
              >
                <Brand kind={it.brand} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-white">{it.label}</span>
                  {it.sub && <span className="block text-[11px] text-white/45">{it.sub}</span>}
                </span>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
