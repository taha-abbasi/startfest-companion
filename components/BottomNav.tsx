"use client";

import React from "react";
import { useApp } from "@/components/store";
import { Calendar, MessageCircle, Bookmark, Users } from "@/components/icons";

type ViewId = "schedule" | "lounge" | "directory" | "agenda";

function fmt(n: number) {
  return n > 9 ? "9+" : String(n);
}

export function BottomNav() {
  const { view, setView, mySet, unreadFor } = useApp();
  const count = mySet.size;
  const loungeUnread = unreadFor("general");

  const Tab = ({
    id,
    label,
    icon,
    badge,
    alert,
  }: {
    id: ViewId;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    alert?: boolean;
  }) => {
    const active = view === id;
    return (
      <button
        onClick={() => setView(id)}
        title={label}
        aria-label={badge ? `${label}, ${badge} unread` : label}
        className={`relative flex items-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-bold transition ${
          active ? "bg-lime text-navy-900" : "text-white/65 hover:text-white"
        }`}
      >
        {icon}
        {active && <span>{label}</span>}
        {badge ? (
          alert ? (
            // unread "alert" badge — sits on the icon, red, attention-grabbing
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[#0a1f4d] bg-rose-500 px-1 text-[10px] font-extrabold text-white">
              {fmt(badge)}
            </span>
          ) : (
            <span
              className={`inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-extrabold ${
                active ? "bg-navy-900 text-lime" : "bg-lime text-navy-900"
              }`}
            >
              {badge}
            </span>
          )
        ) : null}
      </button>
    );
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-white/12 bg-[#0a1f4d]/90 p-1 shadow-2xl backdrop-blur-md">
        <Tab id="schedule" label="Schedule" icon={<Calendar width={17} height={17} />} />
        <Tab id="lounge" label="Lounge" icon={<MessageCircle width={17} height={17} />} badge={loungeUnread} alert />
        <Tab id="directory" label="Slopers" icon={<Users width={17} height={17} />} />
        <Tab id="agenda" label="Agenda" icon={<Bookmark width={17} height={17} />} badge={count} />
      </div>
    </div>
  );
}
