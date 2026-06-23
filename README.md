# StartFest 2026 Companion

A fast, no-friction conference companion for **StartFest 2026** by **Silicon Slopes**
(June 23–24, 2026). Browse the full agenda, build a personal schedule, see who's
going, catch time conflicts, and get a calendar reminder before every session — no
account, no app install.

> An independent, open-source community tool. Built by **Taha Salahuddin Abbasi**
> _(The Brown Cowboy)_, powered by [AskFlorence](https://askflorence.health).

---

## What it does

- **Browse free** — the entire two-day, six-track agenda, no sign-up required.
- **Build your schedule** — tap **Add** on any session. Identity is just a name +
  email (no password). Saved across devices.
- **Live attendance** — real-time headcounts and a Luma-style "who's going" list
  (names shown only with consent; emails/phones are never exposed).
- **Conflict detection** — overlapping picks are flagged on the card and summarized
  in My Agenda.
- **Calendar everywhere** — one-tap `.ics` per session or for your whole agenda,
  each event carrying a 30-minute alarm so your phone reminds you natively.
- **Email** — an instant confirmation (with the calendar invite attached) and an
  optional morning-of digest. CAN-SPAM compliant with one-click unsubscribe.
- **SMS-ready** — phone + consent are captured; texts switch on automatically the
  moment Twilio credentials are configured (see `lib/sms.ts`).

## Stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript** + **Tailwind CSS**
- **MongoDB** for attendees & signups (collections namespaced under `startfest_`)
- **Resend** for transactional email
- **Vercel** for hosting + a daily-digest cron

## Data model

Two collections, both prefixed so they're isolated from anything else in the database:

- `startfest_attendees` — `{ email (unique), name, phone, emailOptIn, smsOptIn,
  showPublicly, unsubscribedAt, lastDigestDate }`
- `startfest_signups` — `{ sessionId, email, name, showPublicly, createdAt }`,
  unique on `(sessionId, email)`

The agenda itself lives in code at [`data/schedule.ts`](data/schedule.ts) — the single
source of truth. Edit there to correct any session detail.

## Privacy & identity

There are no passwords. When you enter your name + email, the server sets a signed
(HMAC-SHA256) httpOnly cookie binding the browser to your email, so nobody can
impersonate you by editing a cookie. Email links (manage / unsubscribe) use the same
scheme as stateless, purpose-bound tokens. Email and phone numbers are never returned
by any public endpoint — only names, and only for attendees who opted in.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev
```

### Environment variables

See [`.env.example`](.env.example). Required: `MONGODB_URI`, `MONGODB_DB`,
`RESEND_API_KEY`, `EMAIL_FROM`, `APP_SECRET`, `CRON_SECRET`. Optional: `TWILIO_*`
to enable SMS, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_ASKFLORENCE_URL`.

## Cron

`vercel.json` schedules `GET /api/cron/daily-digest` once a day (13:00 UTC ≈ 7am MT).
It emails each opted-in attendee their picks for that conference day and is idempotent
(guarded by `lastDigestDate`). The endpoint requires `Authorization: Bearer $CRON_SECRET`.

## License

MIT. Not officially affiliated with Silicon Slopes or StartFest.
