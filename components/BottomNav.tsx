"use client";

import React from "react";
import { useApp } from "@/components/store";
import { Calendar, MessageCircle, Bookmark, Users } from "@/components/icons";

type ViewId = "schedule" | "lounge" | "directory" | "agenda";

export function BottomNav() {
  const { view, setView, mySet } = useApp();
  const count = mySet.size;

  const Tab = ({
    id,
    label,
    icon,
    badge,
  }: {
    id: ViewId;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }) => {
    const active = view === id;
    return (
      <button
        onClick={() => setView(id)}
        title={label}
        aria-label={label}
        className={`relative flex items-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-bold transition ${
          active ? "bg-lime text-navy-900" : "text-white/65 hover:text-white"
        }`}
      >
        {icon}
        {/* label only on the active tab keeps 4 tabs compact on mobile */}
        {active && <span>{label}</span>}
        {badge ? (
          <span
            className={`inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-extrabold ${
              active ? "bg-navy-900 text-lime" : "bg-lime text-navy-900"
            }`}
          >
            {badge}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-white/12 bg-[#0a1f4d]/90 p-1 shadow-2xl backdrop-blur-md">
        <Tab id="schedule" label="Schedule" icon={<Calendar width={17} height={17} />} />
        <Tab id="lounge" label="Lounge" icon={<MessageCircle width={17} height={17} />} />
        <Tab id="directory" label="Slopers" icon={<Users width={17} height={17} />} />
        <Tab id="agenda" label="Agenda" icon={<Bookmark width={17} height={17} />} badge={count} />
      </div>
    </div>
  );
}
