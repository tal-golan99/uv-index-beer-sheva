import { NextRequest, NextResponse } from "next/server";
import { fetchUVForecast, findThresholdHour } from "@/lib/openmeteo";
import {
  getActiveProfileSubscribers,
  upsertDailyAlert,
  getPendingAlerts,
  markAlertSent,
} from "@/lib/supabase";
import { notifySubscribers } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const THRESHOLD = 9;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const isEarlyMorning = now.getHours() < 9; // seed phase

  try {
    if (isEarlyMorning) {
      await seedTodayAlert(todayStr);
    }

    await dispatchPendingAlerts(now);

    return NextResponse.json({ ok: true, ts: now.toISOString() });
  } catch (err) {
    console.error("Cron error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

async function seedTodayAlert(date: string) {
  const forecast = await fetchUVForecast();
  const hit = findThresholdHour(forecast.today, THRESHOLD);
  if (!hit) return;

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
