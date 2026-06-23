"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/components/store";
import { BRAND } from "@/lib/brand";
import { X, ArrowRight, Sparkle } from "@/components/icons";

const PRESETS = [5, 10, 25, 50];

function venmoUrl(amount: number) {
  const note = `Support StartFest — ${BRAND.donateBeneficiary} 🤠`;
  return `https://venmo.com/${encodeURIComponent(BRAND.venmoHandle)}?txn=pay&amount=${amount}&note=${encodeURIComponent(note)}`;
}

export function DonateModal() {
  const { donateOpen, closeDonate } = useApp();
  const [amount, setAmount] = useState(10);
  const [custom, setCustom] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDonate();
    if (donateOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [donateOpen, closeDonate]);

  if (!donateOpen) return null;

  const amt = custom ? Math.max(1, Math.round(Number(custom) || 0)) : amount;
  const url = venmoUrl(amt);
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(url)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={closeDonate}
    >
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/12 bg-[#0a1f4d] p-5 shadow-2xl animate-fade-up sm:rounded-3xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-lime">
              <Sparkle width={13} height={13} /> Support StartFest
            </div>
            <h2 className="text-xl font-bold text-white">Chip in for {BRAND.donateBeneficiary} ♥</h2>
          </div>
          <button onClick={closeDonate} className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white">
            <X width={20} height={20} />
          </button>
        </div>

        <p className="text-sm leading-relaxed text-white/65">
          Love the app? Toss in a few bucks — <span className="font-semibold text-white">100% goes to {BRAND.donateBeneficiary}</span>.
          (The app itself plans to sustain via a small % of event add-ons; community tips go straight to the program.)
        </p>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {PRESETS.map((p) => {
            const active = !custom && amount === p;
            return (
              <button
                key={p}
                onClick={() => {
                  setCustom("");
                  setAmount(p);
                }}
                className={`rounded-xl border py-2.5 text-sm font-bold transition ${
                  active ? "border-lime bg-lime/15 text-lime" : "border-white/15 text-white/80 hover:bg-white/[0.06]"
                }`}
              >
                ${p}
              </button>
            );
          })}
        </div>

        <div className="mt-2">
          <input
            inputMode="numeric"
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="Custom amount ($)"
            className="input"
          />
        </div>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-lime mt-4 w-full py-3 text-base"
        >
          Donate ${amt} with Venmo
          <ArrowRight width={18} height={18} />
        </a>

        <div className="mt-4 flex flex-col items-center">
          <span className="mb-2 text-xs text-white/45">or scan to pay from another phone</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr}
            alt="Venmo donation QR code"
            width={160}
            height={160}
            className="h-40 w-40 rounded-xl bg-white p-1"
          />
          <span className="mt-2 text-xs text-white/45">Venmo @{BRAND.venmoHandle}</span>
        </div>

        <p className="mt-4 text-center text-[11px] text-white/35">
          Payments are handled securely by Venmo. This app never sees your payment details.
        </p>
      </div>
    </div>
  );
}
