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

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const isEarlyMorning = now.getHours() < 9; // seed phase (UTC, matches Vercel 0 7 * * * trigger)

  const israelHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jerusalem",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(now)
  );
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
  const forecast = await fetchUVForecast();
  const hit = findThresholdHour(forecast.today, THRESHOLD);

  if (hit) {
    const thresholdAt = new Date(hit.time);
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
  const chartHours = forecast.today.hours.filter((h) => {
    const hr = parseInt(h.time.slice(11, 13));
    return hr >= 8 && hr <= 17;
  });
  // Use UV >= 8 to detect pool hours — hourly averages near 8 will cross 9 during the hour.
  // poolTo + 1 because the last hour is a full 60 min block.
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
