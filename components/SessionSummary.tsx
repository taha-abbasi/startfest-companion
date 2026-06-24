"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Sparkle, Users } from "@/components/icons";

interface Highlights {
  tldr: string;
  keyPoints: string[];
  actionItems: string[];
  quotes: string[];
  resources: string[];
}

export function SessionSummary({
  sessionId,
  reloadToken = 0,
  emptyHint,
}: {
  sessionId: string;
  reloadToken?: number;
  emptyHint?: string;
}) {
  const [summary, setSummary] = useState<Highlights | null>(null);
  const [count, setCount] = useState(0);
  const [contributors, setContributors] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/session-summary?sessionId=${encodeURIComponent(sessionId)}`, {
        cache: "no-store",
      });
      const d = await r.json();
      setSummary(d.summary ?? null);
      setCount(d.count ?? 0);
      setContributors(d.contributors ?? []);
    } catch {
      /* leave as-is */
    } finally {
      setLoaded(true);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load, reloadToken]);

  if (!loaded) return null;
  if (!summary) {
    return emptyHint ? (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center text-sm text-white/50">
        {emptyHint}
      </div>
    ) : null;
  }

  return (
    <div className="rounded-2xl border border-lime/25 bg-lime/[0.06] p-4">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-lime">
          <Sparkle width={13} height={13} /> Shared session summary
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-white/55">
          <Users width={12} height={12} />
          {count} {count === 1 ? "contributor" : "contributors"}
        </span>
      </div>
      {summary.tldr && <p className="text-sm text-white/85">{summary.tldr}</p>}
      {summary.keyPoints.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-white/75">
          {summary.keyPoints.map((k, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-lime">•</span>
              {k}
            </li>
          ))}
        </ul>
      )}
      {summary.actionItems.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-semibold text-white/60">Action items</div>
          <ul className="mt-1 space-y-1 text-sm text-white/75">
            {summary.actionItems.map((k, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-lime">☐</span>
                {k}
              </li>
            ))}
          </ul>
        </div>
      )}
      {summary.resources.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {summary.resources.map((k, i) => (
            <span key={i} className="chip border border-white/15 bg-white/5 text-white/70">
              {k}
            </span>
          ))}
        </div>
      )}
      {contributors.length > 0 && (
        <p className="mt-3 text-[11px] text-white/40">Compiled from notes by {contributors.join(", ")}</p>
      )}
    </div>
  );
}
