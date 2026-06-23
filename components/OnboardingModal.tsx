"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/components/store";
import { getSession } from "@/data/schedule";
import { X, ArrowRight, Plus } from "@/components/icons";
import { BRAND } from "@/lib/brand";

function Checkbox({
  checked,
  onChange,
  title,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  desc: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
          checked ? "border-lime bg-lime text-navy-900" : "border-white/30 bg-transparent"
        }`}
      >
        {checked && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="block text-sm font-semibold text-white">{title}</span>
        <span className="block text-xs text-white/55">{desc}</span>
      </span>
    </label>
  );
}

export function OnboardingModal() {
  const { onboarding, closeOnboarding, identify, attendee } = useApp();
  const editing = !!attendee && onboarding.pendingSessionId === null;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [showPublicly, setShowPublicly] = useState(true);
  const [showPhone, setShowPhone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Hydrate when opening (edit mode pre-fills existing values).
  useEffect(() => {
    if (onboarding.open) {
      setName(attendee?.name ?? "");
      setEmail(attendee?.email ?? "");
      setPhone(attendee?.phone ?? "");
      setEmailOptIn(attendee?.emailOptIn ?? true);
      setSmsOptIn(attendee?.smsOptIn ?? false);
      setShowPublicly(attendee?.showPublicly ?? true);
      setShowPhone(!!attendee?.phone); // only reveal phone if they already added one
      setErr(null);
    }
  }, [onboarding.open, attendee]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeOnboarding();
    if (onboarding.open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onboarding.open, closeOnboarding]);

  if (!onboarding.open) return null;

  const pending = onboarding.pendingSessionId ? getSession(onboarding.pendingSessionId) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!name.trim()) return setErr("Please enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErr("Please enter a valid email.");
    setSubmitting(true);
    const res = await identify({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      emailOptIn,
      smsOptIn,
      showPublicly,
    });
    setSubmitting(false);
    if (!res.ok) setErr(res.error ?? "Something went wrong.");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={closeOnboarding}
    >
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/12 bg-[#0a1f4d] p-5 shadow-2xl animate-fade-up sm:rounded-3xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              {editing ? "Your details" : pending ? "Almost there" : "Join StartFest"}
            </h2>
            <p className="mt-1 text-sm text-white/55">
              {pending ? (
                <>
                  One quick step to add{" "}
                  <span className="font-semibold text-lime">{pending.title}</span>.
                </>
              ) : (
                "No password. Just your name & email so we can save your schedule and remind you."
              )}
            </p>
          </div>
          <button onClick={closeOnboarding} className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white">
            <X width={20} height={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3.5">
          <div>
            <label className="label" htmlFor="ob-name">Name</label>
            <input
              id="ob-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Founder"
              autoFocus
              autoComplete="name"
            />
          </div>
          <div>
            <label className="label" htmlFor="ob-email">Email</label>
            <input
              id="ob-email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@startup.com"
              autoComplete="email"
            />
          </div>
          {/* Phone is fully optional — hidden behind a toggle to keep sign-up to name + email. */}
          {!showPhone ? (
            <button
              type="button"
              onClick={() => setShowPhone(true)}
              className="flex w-full items-center gap-2 rounded-xl border border-dashed border-white/15 px-3.5 py-2.5 text-left text-sm text-white/60 transition hover:border-white/30 hover:text-white/80"
            >
              <Plus width={15} height={15} className="text-lime" />
              Add phone for text reminders
              <span className="ml-auto text-xs text-white/35">optional</span>
            </button>
          ) : (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="label mb-0" htmlFor="ob-phone">
                  Phone <span className="font-normal text-white/40">· optional</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowPhone(false);
                    setPhone("");
                    setSmsOptIn(false);
                  }}
                  className="text-xs text-white/40 hover:text-white/70"
                >
                  remove
                </button>
              </div>
              <input
                id="ob-phone"
                type="tel"
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(801) 555-0123"
                autoComplete="tel"
                autoFocus
              />
            </div>
          )}

          <div className="space-y-2 pt-1">
            <Checkbox
              checked={emailOptIn}
              onChange={setEmailOptIn}
              title="Email my confirmations & reminders"
              desc="A calendar invite per session, plus a morning-of agenda. Unsubscribe anytime."
            />
            {showPhone && phone.trim() && (
              <Checkbox
                checked={smsOptIn}
                onChange={setSmsOptIn}
                title="Text me reminders"
                desc="SMS reminders (rolling out). Your calendar invite already buzzes you 30 min before."
              />
            )}
            <Checkbox
              checked={showPublicly}
              onChange={setShowPublicly}
              title="Show my name on “who's going”"
              desc="Let other attendees see you're attending. Your email & phone are never shared."
            />
          </div>

          {err && (
            <div className="rounded-lg bg-rose-500/15 px-3 py-2 text-sm font-medium text-rose-200">{err}</div>
          )}

          <button type="submit" disabled={submitting} className="btn-lime w-full py-3 text-base">
            {submitting ? "Saving…" : editing ? "Save changes" : pending ? "Add session" : "Save & continue"}
            {!submitting && <ArrowRight width={18} height={18} />}
          </button>

          <p className="pt-1 text-center text-[11px] leading-relaxed text-white/40">
            By continuing you agree we can email you about sessions you add. We never sell your data.
            <br />An app by {BRAND.builder} · Powered by {BRAND.sponsorName}.
          </p>
        </form>
      </div>
    </div>
  );
}
