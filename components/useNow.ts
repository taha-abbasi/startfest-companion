"use client";

import { useEffect, useState } from "react";

/** Ticking "now" in epoch ms, updated on an interval. */
export function useNow(intervalMs = 30000): number {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), intervalMs);
    const onFocus = () => setNow(Date.now());
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(i);
      window.removeEventListener("focus", onFocus);
    };
  }, [intervalMs]);
  return now;
}
