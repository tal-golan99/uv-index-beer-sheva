import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchUVForecast, findThresholdHour } from "@/lib/openmeteo";
import { getActiveProfileSubscribers, upsertDailyAlert } from "@/lib/supabase";
import { notifyMorningForecast } from "@/lib/notifications";
import { getMorningMessage } from "@/lib/morning-messages";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const forecast = await fetchUVForecast();
    const subscribers = await getActiveProfileSubscribers();

    console.log("=== TEST CRON ===");
    console.log("Forecast current UV:", forecast.current);
    console.log("Active subscribers:", subscribers.length);
    console.log("Subscribers with Telegram:", subscribers.filter(s => s.telegram_chat_id).length);

    const chatIds = subscribers
      .map((s) => s.telegram_chat_id!)
      .filter(Boolean);

    if (!chatIds.length) {
      return NextResponse.json({
        error: "No Telegram chat IDs found",
        subscriberCount: subscribers.length,
        telegramEnabled: subscribers.filter(s => s.telegram_chat_id).length
      });
    }

    const chartHours = forecast.today.hours.filter((h) => {
      const hr = parseInt(h.time.slice(11, 13));
      return hr >= 8 && hr <= 17;
    });
    const poolHours = chartHours.filter((h) => h.uv_index >= 9);
    const poolFrom = poolHours[0] ? parseInt(poolHours[0].time.slice(11, 13)) : null;
    const poolTo   = poolHours.at(-1) ? parseInt(poolHours.at(-1)!.time.slice(11, 13)) : null;
    const peak     = chartHours.reduce((a, b) => (a.uv_index >= b.uv_index ? a : b), chartHours[0]);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

    console.log("Chat IDs:", chatIds);
    console.log("Pool hours: ", poolFrom, "-", poolTo);
    console.log("Chart URL:", `${appUrl}/api/og/daily-uv`);
    console.log("App URL:", appUrl);

    // Test the photo endpoint first
    const photoRes = await fetch(`${appUrl}/api/og/daily-uv`);
    console.log("Photo endpoint status:", photoRes.status);
    if (!photoRes.ok) {
      console.log("Photo endpoint error:", await photoRes.text());
    }

    // Send a text-only test message (photo URL can't be fetched from localhost by Telegram)
    const testChatId = chatIds[0];
    const messageText =
      `☀️ בוקר טוב לכל השזופים והשזופות ☀️\n\n` +
      `🏊 זמן בריכה: ${poolFrom ?? "?"}:00–${poolTo ?? "?"}:00 (UV ≥ 9)\n` +
      `⚡ שיא: ${peak ? parseInt(peak.time.slice(11,13)) : "?"}:00 עם UV ${peak?.uv_index ?? "?"}\n\n` +
      `🧪 הודעת בדיקה — בייצור תגיע עם תמונת גרף`;

    const testRes = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: testChatId,
          text: messageText,
        }),
      }
    );

    const testData = await testRes.json();
    console.log("Test Telegram response:", testRes.status, testData);

    if (!testRes.ok) {
      return NextResponse.json({
        error: "Telegram API failed",
        telegramError: testData,
        token: `${process.env.TELEGRAM_BOT_TOKEN?.slice(0, 10)}...`
      });
    }

    return NextResponse.json({
      ok: true,
      chatIds: chatIds.length,
      testSent: true,
      sentTo: testChatId,
    });
  } catch (err) {
    console.error("Test error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
