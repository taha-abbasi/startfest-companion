"use client";

import React from "react";
import { BRAND } from "@/lib/brand";
import { useApp } from "@/components/store";
import { ArrowRight, Sparkle } from "@/components/icons";

const REPO_URL = "https://github.com/taha-abbasi/startfest-companion";

export function Footer() {
  const { openDonate } = useApp();
  return (
    <footer className="px-4 pb-32 pt-8">
      <div className="mx-auto max-w-4xl">
        {/* Support / donate */}
        <button
          onClick={openDonate}
          className="mb-3 flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-lime/40 hover:bg-white/[0.06]"
        >
          <span>
            <span className="block text-sm font-bold text-white">Enjoying the app? Support {BRAND.donateBeneficiary} ♥</span>
            <span className="mt-0.5 block text-[13px] text-white/55">
              Chip in via Venmo — 100% goes to the program.
            </span>
          </span>
          <span className="btn-lime shrink-0">Donate</span>
        </button>

        {/* Lead-gen: Powered by AskFlorence */}
        <a
          href={BRAND.sponsorUrl}
          target="_blank"
          rel="noopener"
          className="group block overflow-hidden rounded-2xl border border-lime/25 bg-gradient-to-br from-[#0c2a66] to-[#0a1f4d] p-5 transition hover:border-lime/50"
        >
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-lime">
            <Sparkle width={14} height={14} /> Powered by {BRAND.sponsorName}
          </div>
          <p className="mt-2 max-w-2xl text-[15px] font-medium leading-relaxed text-white/85">
            {BRAND.sponsorTagline}
          </p>
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-lime">
            {BRAND.sponsorCta}
            <ArrowRight width={16} height={16} className="transition group-hover:translate-x-0.5" />
          </span>
        </a>

        {/* Credits */}
        <div className="mt-6 flex flex-col gap-2 text-[13px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <div>
            An app by{" "}
            <a href={BRAND.builderUrl} target="_blank" rel="noopener" className="font-semibold text-white/70 hover:text-lime">
              {BRAND.builder}
            </a>{" "}
            <span className="text-white/35">({BRAND.builderAlias})</span>
          </div>
          <div className="flex items-center gap-3">
            <a href={REPO_URL} target="_blank" rel="noopener" className="hover:text-white/70">
              View source
            </a>
            <span className="text-white/20">·</span>
            <span>Times in Mountain Time</span>
          </div>
        </div>
        <p className="mt-3 text-[12px] text-white/30">
          An independent, open-source companion for StartFest by Silicon Slopes. Not officially affiliated. Schedule
          subject to change.
        </p>
      </div>
    </footer>
  );
}
