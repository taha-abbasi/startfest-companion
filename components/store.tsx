"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { findConflicts, getSession } from "@/data/schedule";

export interface Attendee {
  name: string;
  email: string;
  phone?: string | null;
  emailOptIn: boolean;
  smsOptIn: boolean;
  showPublicly: boolean;
}

export interface IdentifyPayload {
  name: string;
  email: string;
  phone?: string;
  emailOptIn: boolean;
  smsOptIn: boolean;
  showPublicly: boolean;
}

type View = "schedule" | "agenda" | "lounge";

export interface Toast {
  id: number;
  text: string;
  tone: "success" | "info" | "warn" | "error";
}

interface OnboardingState {
  open: boolean;
  pendingSessionId: string | null;
}

interface AppCtx {
  attendee: Attendee | null;
  mySet: Set<string>;
  counts: Record<string, number>;
  conflictIds: Set<string>;
  feedToken: string | null;

  view: View;
  setView: (v: View) => void;

  isGoing: (id: string) => boolean;
  countFor: (id: string) => number;
  toggle: (id: string) => Promise<void>;
  busyId: string | null;

  onboarding: OnboardingState;
  openOnboarding: (pendingSessionId?: string | null) => void;
  closeOnboarding: () => void;
  identify: (p: IdentifyPayload) => Promise<{ ok: boolean; error?: string }>;
  editProfile: () => void;

  attendeesFor: string | null;
  openAttendees: (id: string) => void;
  closeAttendees: () => void;

  chatSessionId: string | null;
  openChat: (id: string) => void;
  closeChat: () => void;

  donateOpen: boolean;
  openDonate: () => void;
  closeDonate: () => void;

  toasts: Toast[];
  pushToast: (text: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: number) => void;

  attendeeCount: number;
  goingTotal: number;

  refreshCounts: () => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function useApp(): AppCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used within AppProvider");
  return v;
}

export function AppProvider({
  initialAttendee,
  initialSessionIds,
  initialCounts,
  initialFeedToken = null,
  initialAttendeeCount = 0,
  children,
}: {
  initialAttendee: Attendee | null;
  initialSessionIds: string[];
  initialCounts: Record<string, number>;
  initialFeedToken?: string | null;
  initialAttendeeCount?: number;
  children: React.ReactNode;
}) {
  const [attendee, setAttendee] = useState<Attendee | null>(initialAttendee);
  const [mySet, setMySet] = useState<Set<string>>(new Set(initialSessionIds));
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  const [feedToken, setFeedToken] = useState<string | null>(initialFeedToken);
  const [attendeeCount, setAttendeeCount] = useState<number>(initialAttendeeCount);
  const [goingTotal, setGoingTotal] = useState<number>(() =>
    Object.values(initialCounts).reduce((a, b) => a + b, 0)
  );
  const [view, setView] = useState<View>("schedule");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingState>({ open: false, pendingSessionId: null });
  const [attendeesFor, setAttendeesFor] = useState<string | null>(null);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [donateOpen, setDonateOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toastSeq = useRef(0);
  const pushToast = useCallback((text: string, tone: Toast["tone"] = "info") => {
    const id = ++toastSeq.current;
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const conflictIds = useMemo(() => new Set(findConflicts([...mySet]).flat()), [mySet]);

  const isGoing = useCallback((id: string) => mySet.has(id), [mySet]);
  const countFor = useCallback((id: string) => counts[id] ?? 0, [counts]);

  const refreshCounts = useCallback(async () => {
    try {
      const r = await fetch("/api/sessions/counts", { cache: "no-store" });
      if (!r.ok) return;
      const data = await r.json();
      if (data?.counts) setCounts(data.counts);
      if (typeof data?.attendees === "number") setAttendeeCount(data.attendees);
      if (typeof data?.going === "number") setGoingTotal(data.going);
    } catch {
      /* offline; keep last known */
    }
  }, []);

  // Poll live counts periodically + on focus.
  useEffect(() => {
    const iv = setInterval(refreshCounts, 25000);
    const onFocus = () => refreshCounts();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(iv);
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshCounts]);

  const doSignup = useCallback(
    async (id: string) => {
      setBusyId(id);
      const wasGoing = mySet.has(id);
      // optimistic
      setMySet((prev) => {
        const next = new Set(prev);
        if (wasGoing) next.delete(id);
        else next.add(id);
        return next;
      });
      setCounts((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + (wasGoing ? -1 : 1)) }));
      setGoingTotal((g) => Math.max(0, g + (wasGoing ? -1 : 1)));

      try {
        let res: Response;
        if (wasGoing) {
          res = await fetch(`/api/signups/${encodeURIComponent(id)}`, { method: "DELETE" });
        } else {
          res = await fetch("/api/signups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: id }),
          });
        }
        if (res.status === 401) {
          // identity lost — revert and prompt
          setMySet((prev) => {
            const next = new Set(prev);
            if (wasGoing) next.add(id);
            else next.delete(id);
            return next;
          });
          setCounts((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + (wasGoing ? 1 : -1)) }));
          setGoingTotal((g) => Math.max(0, g + (wasGoing ? 1 : -1)));
          openOnboarding(id);
          return;
        }
        if (!res.ok) throw new Error("request failed");
        const data = await res.json();
        if (typeof data.count === "number") {
          setCounts((prev) => ({ ...prev, [id]: data.count }));
        }
        const session = getSession(id);
        if (!wasGoing) {
          const emailNote =
            data.emailStatus === "sent" ? " Check your email for the calendar invite." : "";
          pushToast(`Added “${session?.title ?? "session"}”.${emailNote}`, "success");
          // conflict nudge
          const others = [...mySet].filter((x) => x !== id);
          const conflictsNow = findConflicts([...others, id]).filter((pair) => pair.includes(id));
          if (conflictsNow.length) {
            const otherId = conflictsNow[0].find((x) => x !== id);
            const otherTitle = otherId ? getSession(otherId)?.title : "another session";
            pushToast(`Heads up: this overlaps “${otherTitle}”.`, "warn");
          }
        } else {
          pushToast(`Removed “${session?.title ?? "session"}”.`, "info");
        }
      } catch {
        // revert
        setMySet((prev) => {
          const next = new Set(prev);
          if (wasGoing) next.add(id);
          else next.delete(id);
          return next;
        });
        setCounts((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + (wasGoing ? 1 : -1)) }));
        setGoingTotal((g) => Math.max(0, g + (wasGoing ? 1 : -1)));
        pushToast("Something went wrong. Please try again.", "error");
      } finally {
        setBusyId(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mySet, pushToast]
  );

  const openOnboarding = useCallback((pendingSessionId: string | null = null) => {
    setOnboarding({ open: true, pendingSessionId });
  }, []);
  const closeOnboarding = useCallback(() => {
    setOnboarding({ open: false, pendingSessionId: null });
  }, []);
  const editProfile = useCallback(() => setOnboarding({ open: true, pendingSessionId: null }), []);

  const toggle = useCallback(
    async (id: string) => {
      if (!attendee) {
        openOnboarding(id);
        return;
      }
      await doSignup(id);
    },
    [attendee, doSignup, openOnboarding]
  );

  const identify = useCallback(
    async (p: IdentifyPayload): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/identify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(p),
        });
        const data = await res.json();
        if (!res.ok) return { ok: false, error: data?.error || "Could not save your details." };
        setAttendee(data.attendee);
        if (data.feedToken) setFeedToken(data.feedToken);
        if (Array.isArray(data.sessionIds)) setMySet(new Set(data.sessionIds));
        const pending = onboarding.pendingSessionId;
        closeOnboarding();
        pushToast(`You're all set, ${data.attendee.name.split(" ")[0]}! 👋`, "success");
        if (pending && !data.sessionIds?.includes(pending)) {
          // sign them up for what they were trying to add
          setTimeout(() => doSignup(pending), 150);
        }
        // pick up the updated community headcount (new Sloper just joined)
        refreshCounts();
        return { ok: true };
      } catch {
        return { ok: false, error: "Network error. Please try again." };
      }
    },
    [onboarding.pendingSessionId, closeOnboarding, pushToast, doSignup, refreshCounts]
  );

  const openAttendees = useCallback((id: string) => setAttendeesFor(id), []);
  const closeAttendees = useCallback(() => setAttendeesFor(null), []);
  const openChat = useCallback((id: string) => {
    setAttendeesFor(null);
    setChatSessionId(id);
  }, []);
  const closeChat = useCallback(() => setChatSessionId(null), []);
  const openDonate = useCallback(() => setDonateOpen(true), []);
  const closeDonate = useCallback(() => setDonateOpen(false), []);

  const value: AppCtx = {
    attendee,
    mySet,
    counts,
    conflictIds,
    feedToken,
    view,
    setView,
    isGoing,
    countFor,
    toggle,
    busyId,
    onboarding,
    openOnboarding,
    closeOnboarding,
    identify,
    editProfile,
    attendeesFor,
    openAttendees,
    closeAttendees,
    chatSessionId,
    openChat,
    closeChat,
    donateOpen,
    openDonate,
    closeDonate,
    toasts,
    pushToast,
    dismissToast,
    attendeeCount,
    goingTotal,
    refreshCounts,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
