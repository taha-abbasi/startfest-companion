"use client";

import React from "react";
import { useApp } from "@/components/store";
import { Check, Warn, X } from "@/components/icons";

const toneStyles: Record<string, string> = {
  success: "border-lime/40 bg-[#11321f]",
  info: "border-white/15 bg-[#0d2557]",
  warn: "border-amber-400/40 bg-[#3a2c08]",
  error: "border-rose-400/40 bg-[#3a1020]",
};

export function Toasts() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm text-white shadow-xl animate-fade-up ${
            toneStyles[t.tone] ?? toneStyles.info
          }`}
        >
          <span className="mt-0.5 shrink-0">
            {t.tone === "success" ? (
              <Check width={16} height={16} className="text-lime" />
            ) : t.tone === "warn" ? (
              <Warn width={16} height={16} className="text-amber-300" />
            ) : t.tone === "error" ? (
              <Warn width={16} height={16} className="text-rose-300" />
            ) : null}
          </span>
          <span className="flex-1 leading-snug">{t.text}</span>
          <button onClick={() => dismissToast(t.id)} className="shrink-0 text-white/40 hover:text-white">
            <X width={15} height={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
