"use client";

import React, { useEffect } from "react";
import { AppProvider, useApp, type Attendee } from "@/components/store";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { ScheduleView } from "@/components/ScheduleView";
import { MyAgenda } from "@/components/MyAgenda";
import { Lounge } from "@/components/Lounge";
import { OnboardingModal } from "@/components/OnboardingModal";
import { AttendeesModal } from "@/components/AttendeesModal";
import { SessionChatModal } from "@/components/SessionChatModal";
import { SessionNotes } from "@/components/SessionNotes";
import { DonateModal } from "@/components/DonateModal";
import { MeetTheMaker } from "@/components/MeetTheMaker";
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
        <div className="mx-auto max-w-4xl">
          {view === "schedule" && <ScheduleView />}
          {view === "lounge" && <Lounge />}
          {view === "agenda" && <MyAgenda />}
        </div>
      </main>
      {view === "schedule" && <MeetTheMaker />}
      <Footer />
      <BottomNav />
      <OnboardingModal />
      <AttendeesModal />
      <SessionChatModal />
      <SessionNotes />
      <DonateModal />
      <Toasts />
    </>
  );
}

export function AppClient({
  initialAttendee,
  initialSessionIds,
  initialCounts,
  initialFeedToken = null,
  initialAttendeeCount = 0,
}: {
  initialAttendee: Attendee | null;
  initialSessionIds: string[];
  initialCounts: Record<string, number>;
  initialFeedToken?: string | null;
  initialAttendeeCount?: number;
}) {
  return (
    <AppProvider
      initialAttendee={initialAttendee}
      initialSessionIds={initialSessionIds}
      initialCounts={initialCounts}
      initialFeedToken={initialFeedToken}
      initialAttendeeCount={initialAttendeeCount}
    >
      <Body />
    </AppProvider>
  );
}
