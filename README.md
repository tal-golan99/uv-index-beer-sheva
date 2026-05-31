# UV Index Monitor

Real-time UV index tracker for Beer Sheva with push notifications when UV reaches dangerous levels.

## What it does

- Displays current UV index, today's hourly forecast, and a 7-day outlook
- Sends WhatsApp and Telegram alerts before UV hits the configured threshold (default: UV ≥ 9)
- Tracks pool visits and streaks for subscribed users
- Shows live pool presence so users know who's there

## Stack

Next.js 15 App Router · TypeScript · Tailwind CSS v4 · Supabase · Vercel

## Getting started

```bash
cp .env.local.example .env.local
# fill in the required vars (see below)
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (client-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `CRON_SECRET` | Shared secret for the `/api/cron/check` endpoint |
| `NEXT_PUBLIC_APP_URL` | Production URL (e.g. `https://yourapp.vercel.app`) |

## Notification pipeline

Two cron phases hit the same `/api/cron/check` endpoint (requires `Authorization: Bearer <CRON_SECRET>`):

1. **Morning seed** — `0 7 * * *` UTC via Vercel. Fetches today's UV forecast, finds the first hour where UV ≥ threshold, and writes a `daily_alerts` row with `warn_at` (1 hour before) and `threshold_at`.

2. **Dispatch** — every 30 minutes, **08:00–17:00 Israel time only** (cron-job.org + GitHub Actions backup). Reads pending alerts, sends notifications, marks them sent. The route enforces the time window internally via `Asia/Jerusalem` timezone check, so stray triggers outside the window are silently ignored.

## Database

Supabase migrations live in `supabase/migrations/`. Key tables:

- `subscribers` — per-user notification settings (WhatsApp, Telegram, threshold)
- `daily_alerts` — one row per day tracking `warn_sent` / `threshold_sent`
- `pool_visits` — check-in history per user

RLS is enabled; all server-side code uses `supabaseAdmin` (service role).

## Commands

```bash
npm run dev       # dev server on localhost:3000
npm run build     # production build + type-check
npm run lint      # ESLint
npx tsc --noEmit  # type-check only
```
