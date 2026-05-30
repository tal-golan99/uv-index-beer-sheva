# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server on localhost:3000
npm run build    # production build (also type-checks)
npm run lint     # ESLint via next lint
npx tsc --noEmit # type-check without building
```

No test framework is configured yet.

## Architecture

**Stack**: Next.js 15 App Router + TypeScript, Tailwind CSS v4, Recharts v3, Supabase, Resend, Vercel.

### Data flow

1. `src/lib/openmeteo.ts` — single `fetchUVForecast()` call to Open-Meteo (Beer Sheva, no API key). Returns typed `UVForecast` with current value, today's hourly breakdown, and a 7-day `DailyUV[]`. Results are cached 30 min via `next: { revalidate: 1800 }`.
2. `src/app/page.tsx` — Server Component that calls `fetchUVForecast()` directly and passes data to three Client Components: `UVGauge`, `DailyChart`, `WeeklyChart`.
3. Charts are interactive client-side; no client fetching — all UV data is server-rendered at build/revalidation time.

### Notification pipeline

`vercel.json` registers two cron schedules for `/api/cron/check`:
- `0 7 * * *` — morning seed: fetches today's forecast, finds first hour where UV ≥ 9, writes a row to `daily_alerts` with `warn_at` (threshold − 1h) and `threshold_at`.
- `*/30 * * * *` — dispatch: reads unsent `daily_alerts` where `warn_at ≤ now+35min`, sends Email via Resend and WhatsApp via CallMeBot, then marks each field sent.

The cron endpoint requires `Authorization: Bearer <CRON_SECRET>` — Vercel injects this automatically; for local testing pass it manually.

### Database (Supabase)

Two tables defined in `supabase/migrations/001_schema.sql`:
- `subscribers` — email, whatsapp, callmebot_apikey, threshold (default 9), active. CHECK constraint enforces at least one channel.
- `daily_alerts` — one row per date (UNIQUE on `date`), upserted each morning. Tracks `warn_sent` and `threshold_sent` booleans.

RLS is enabled; only `service_role` has access. Use `supabaseAdmin` (service role key) from server-side code, `supabase` (anon key) is for client-safe queries only.

### Environment variables

See `.env.local.example`. Required vars:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — client-safe
- `SUPABASE_SERVICE_ROLE_KEY` — server only (cron, subscribe API)
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- `CRON_SECRET` — must match value set in Vercel project settings
- `NEXT_PUBLIC_APP_URL` — used in unsubscribe links in emails

### Tailwind v4 note

No `tailwind.config.js` — v4 uses CSS-first configuration. Global styles and theme overrides go in `src/app/globals.css` via `@import "tailwindcss"`. PostCSS is wired through `postcss.config.mjs` using `@tailwindcss/postcss`.
