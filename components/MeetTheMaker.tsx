"use client";

import React from "react";
import { BRAND } from "@/lib/brand";
import { ArrowRight, Sparkle } from "@/components/icons";

// "Howdy, come say hi" — a personal note from the maker, frontier-style. 🤠
export function MeetTheMaker() {
  return (
    <section className="px-4 pt-4">
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-3xl border border-lime/25 bg-gradient-to-br from-[#0c2a66] via-[#0a1f4d] to-[#0a1f4d] p-5 sm:p-7">
          {/* frontier glow */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-lime/10 blur-3xl" />

          <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-7">
            {/* Photo */}
            <div className="shrink-0">
              <div className="relative">
                <img
                  src={BRAND.photo}
                  alt="Taha Salahuddin Abbasi — The Brown Cowboy"
                  width={128}
                  height={128}
                  className="h-28 w-28 rounded-2xl border-2 border-lime/40 object-cover shadow-glow sm:h-32 sm:w-32"
                />
                <span className="absolute -bottom-2 -right-2 rounded-full border border-lime/40 bg-[#0a1f4d] px-2 py-0.5 text-base">
                  🤠
                </span>
              </div>
            </div>

            {/* Note */}
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-lime">
                <Sparkle width={13} height={13} /> Come say hi · Yeehaw
              </div>
              <h2 className="text-xl font-extrabold text-white sm:text-2xl">
                Howdy — I&apos;m Taha, <span className="text-lime">The Brown Cowboy</span> 🤠
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                I built this companion as a little gift to the Slopes community. I&apos;ll be at
                StartFest both days — <span className="font-semibold text-white">look for the cowboy hat
                and jean jacket</span> and come say hi.
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                I also built <span className="font-semibold text-white">AskFlorence</span> after I found out
                the ACA plan Healthcare.gov priced at $960/mo was actually <span className="font-semibold text-lime">$7</span> with
                hidden subsidies applied. If affordable coverage has ever felt out of reach as a founder,
                let&apos;s talk — it&apos;s free for consumers.
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
                <a
                  href={BRAND.introPostUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-lime"
                >
                  Read my intro
                  <ArrowRight width={16} height={16} />
                </a>
                <a
                  href={BRAND.sponsorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost"
                >
                  Try AskFlorence — free
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
