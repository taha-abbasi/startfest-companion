"use client";

import React from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { MessageCircle } from "@/components/icons";

export function Lounge() {
  return (
    <div className="pb-28">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime/15 text-lime">
          <MessageCircle width={18} height={18} />
        </span>
        <div>
          <h1 className="text-lg font-extrabold text-white">The Lounge</h1>
          <p className="text-xs text-white/50">
            Live chat for everyone at StartFest · be kind, have fun 🤠
          </p>
        </div>
      </div>
      <ChatPanel room="general" placeholder="Message the StartFest lounge…" heightClass="h-[68vh]" />
    </div>
  );
}
