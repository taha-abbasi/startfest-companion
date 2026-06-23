"use client";

import React from "react";
import { useApp } from "@/components/store";
import { Calendar, MessageCircle, Bookmark } from "@/components/icons";

export function BottomNav() {
  const { view, setView, mySet } = useApp();
  const count = mySet.size;

  const Tab = ({
    id,
    label,
    icon,
    badge,
  }: {
    id: "schedule" | "lounge" | "agenda";
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }) => {
    const active = view === id;
    return (
      <button
        onClick={() => setView(id)}
        className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-sm font-bold transition sm:px-4 ${
          active ? "bg-lime text-navy-900" : "text-white/70 hover:text-white"
        }`}
      >
        {icon}
        {label}
        {badge ? (
          <span
            className={`ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[11px] font-extrabold ${
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
        <Tab id="schedule" label="Schedule" icon={<Calendar width={16} height={16} />} />
        <Tab id="lounge" label="Lounge" icon={<MessageCircle width={16} height={16} />} />
        <Tab id="agenda" label="Agenda" icon={<Bookmark width={16} height={16} />} badge={count} />
      </div>
    </div>
  );
}
