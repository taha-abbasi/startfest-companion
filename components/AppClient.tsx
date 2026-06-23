"use client";

import React, { useEffect } from "react";
import { AppProvider, useApp, type Attendee } from "@/components/store";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { ScheduleView } from "@/components/ScheduleView";
import { MyAgenda } from "@/components/MyAgenda";
import { OnboardingModal } from "@/components/OnboardingModal";
import { AttendeesModal } from "@/components/AttendeesModal";
import { Toasts } from "@/components/Toasts";

function Body() {
  const { view, pushToast, setView } = useApp();

  // Surface a friendly note when arriving from an email "manage" link.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("welcome") === "1") {
      setView("agenda");
      pushToast("Welcome back — here's your schedule.", "success");
    }
    if (p.get("manage") === "invalid") {
      pushToast("That link expired. Add your email again to sync.", "warn");
    }
    if (p.get("welcome") || p.get("manage") || p.get("view")) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Header />
      <main className="px-4 pt-6">
        <div className="mx-auto max-w-4xl">{view === "schedule" ? <ScheduleView /> : <MyAgenda />}</div>
      </main>
      <Footer />
      <BottomNav />
      <OnboardingModal />
      <AttendeesModal />
      <Toasts />
    </>
  );
}

export function AppClient({
  initialAttendee,
  initialSessionIds,
  initialCounts,
  initialFeedToken = null,
}: {
  initialAttendee: Attendee | null;
  initialSessionIds: string[];
  initialCounts: Record<string, number>;
  initialFeedToken?: string | null;
}) {
  return (
    <AppProvider
      initialAttendee={initialAttendee}
      initialSessionIds={initialSessionIds}
      initialCounts={initialCounts}
      initialFeedToken={initialFeedToken}
    >
      <Body />
    </AppProvider>
  );
}
