import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchUVForecast, findThresholdHour } from "@/lib/openmeteo";
import {
  getActiveProfileSubscribers,
  upsertDailyAlert,
  getPendingAlerts,
  markAlertSent,
} from "@/lib/supabase";
import { notifySubscribers, notifyMorningForecast } from "@/lib/notifications";
import { getMorningMessage } from "@/lib/morning-messages";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const dynamic = "force-dynamic";

const THRESHOLD = 9;

// Open-Meteo returns local Israel time strings like "2026-06-07T11:00" (no tz suffix).
// On Vercel (UTC env) new Date("...T11:00") is parsed as 11:00 UTC = 14:00 Israel — 3h wrong.
// This converts correctly by computing the Israel UTC offset at that instant.
function parseIsraelLocalTime(localStr: string): Date {
  const asUTC = new Date(localStr + "Z");
  const israelStr = asUTC.toLocaleString("sv-SE", { timeZone: "Asia/Jerusalem" });
  const israelAsUTC = new Date(israelStr.replace(" ", "T") + "Z");
  const offsetMs = israelAsUTC.getTime() - asUTC.getTime();
  return new Date(asUTC.getTime() - offsetMs);
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const israelHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jerusalem",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(now)
  );
  // Seed runs only during the 09:xx Israel hour (06:00 UTC in summer).
  // Using Israel time prevents GitHub Actions / cron-job.org triggers at other hours from re-seeding.
  const isEarlyMorning = israelHour >= 9 && israelHour < 10;
  const isDispatchHour = israelHour >= 8 && israelHour < 17;

  try {
    if (isEarlyMorning) {
      await seedTodayAlert(todayStr, now);
    }

    if (isDispatchHour) {
      await dispatchPendingAlerts(now);
      await autoCheckoutIfLowUV();
    }

    return NextResponse.json({ ok: true, ts: now.toISOString(), israelHour });
  } catch (err) {
    console.error("Cron error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

async function seedTodayAlert(date: string, now: Date) {
  // Idempotency: skip if already seeded today (prevents duplicate morning notifications
  // when cron fires twice in the 09:xx window, e.g. at 09:00 and 09:30).
  const admin = getAdmin();
  const { data: existing } = await admin
    .from("daily_alerts")
    .select("id")
    .eq("date", date)
    .maybeSingle();
  if (existing) return;

  const forecast = await fetchUVForecast();
  const hit = findThresholdHour(forecast.today, THRESHOLD);

  if (hit) {
    // hit.time is Israel local (e.g. "2026-06-07T11:00") — must parse with tz awareness.
    const thresholdAt = parseIsraelLocalTime(hit.time);
    const warnAt = new Date(thresholdAt.getTime() - 60 * 60 * 1000);
    await upsertDailyAlert({
      date,
      warn_at: warnAt.toISOString(),
      threshold_at: thresholdAt.toISOString(),
      max_uv: forecast.today.max_uv,
      warn_sent: false,
      threshold_sent: false,
    });
  }

  // Morning Telegram broadcast — send daily UV chart to all opted-in users.
  const subscribers = await getActiveProfileSubscribers();
  if (!subscribers.length) return;

  const chatIds = subscribers.map((s) => s.telegram_chat_id!).filter(Boolean);
  // Use Open-Meteo hourly data (24pts, 1h resolution) for pool window detection.
  // forecast.today.hours is wttr.in 3h-sampled — too coarse (only 12:00 passes UV≥8).
  const allHours = forecast.omHoursToday.length > 0 ? forecast.omHoursToday : forecast.today.hours;
  const chartHours = allHours.filter((h) => {
    const hr = parseInt(h.time.slice(11, 13));
    return hr >= 8 && hr <= 17;
  });
  const poolHours = chartHours.filter((h) => h.uv_index >= 8);
  const poolFrom = poolHours[0] ? parseInt(poolHours[0].time.slice(11, 13)) : null;
  const poolTo   = poolHours.at(-1) ? parseInt(poolHours.at(-1)!.time.slice(11, 13)) + 1 : null;
  const peak     = chartHours.reduce((a, b) => (a.uv_index >= b.uv_index ? a : b), chartHours[0]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  await notifyMorningForecast(chatIds, {
    poolFrom,
    poolTo,
    peakHour: peak ? parseInt(peak.time.slice(11, 13)) : null,
    peakUV: peak?.uv_index ?? null,
    funnyLine: getMorningMessage(now),
    chartUrl: `${appUrl}/api/og/daily-uv`,
    inviteButtonUrl: appUrl,
  });
}

async function autoCheckoutIfLowUV() {
  const forecast = await fetchUVForecast();
  if (forecast.current >= 6) return;

  const admin = getAdmin();
  const { data: present } = await admin.from("pool_presence").select("user_id").limit(1);
  if (!present?.length) return;

  await admin.from("pool_presence").delete().not("user_id", "is", null);
}

async function dispatchPendingAlerts(now: Date) {
  const [alerts, subscribers] = await Promise.all([
    getPendingAlerts(now),
    getActiveProfileSubscribers(),
  ]);

  if (!subscribers.length) return;

  for (const alert of alerts) {
    const warnAt = new Date(alert.warn_at);
    const thresholdAt = new Date(alert.threshold_at);

    if (!alert.warn_sent && warnAt <= now) {
      await notifySubscribers(subscribers, {
        type: "warn",
        uvValue: alert.max_uv,
        alertTime: alert.warn_at,
      });
      await markAlertSent(alert.id, "warn_sent");
    }

    if (!alert.threshold_sent && thresholdAt <= now) {
      await notifySubscribers(subscribers, {
        type: "threshold",
        uvValue: alert.max_uv,
        alertTime: alert.threshold_at,
      });
      await markAlertSent(alert.id, "threshold_sent");
    }
  }
}
