import { NextRequest, NextResponse } from "next/server";
import { fetchUVForecast } from "@/lib/openmeteo";
import { getActiveProfileSubscribers } from "@/lib/supabase";
import { getMorningMessage } from "@/lib/morning-messages";
import { notifyMorningForecast, broadcastText } from "@/lib/notifications";
import { buildWCMessage } from "@/lib/worldcup";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const { searchParams } = new URL(req.url);
    const overrideChatId = searchParams.get("chat_id");

    let chatIds: string[];
    if (overrideChatId) {
      chatIds = [overrideChatId];
    } else {
      const subscribers = await getActiveProfileSubscribers();
      chatIds = subscribers.map((s) => s.telegram_chat_id!).filter(Boolean);
    }

    if (!chatIds.length) {
      return NextResponse.json({ error: "No Telegram chat IDs found" });
    }

    const forecast = await fetchUVForecast();
    const allHours = forecast.omHoursToday.length > 0 ? forecast.omHoursToday : forecast.today.hours;
    const chartHours = allHours.filter((h) => {
      const hr = parseInt(h.time.slice(11, 13));
      return hr >= 8 && hr <= 17;
    });
    const poolHours = chartHours.filter((h) => h.uv_index >= 8);
    const poolFrom = poolHours[0] ? parseInt(poolHours[0].time.slice(11, 13)) : null;
    const poolTo   = poolHours.at(-1) ? parseInt(poolHours.at(-1)!.time.slice(11, 13)) + 1 : null;
    const peak     = chartHours.reduce((a, b) => (a.uv_index >= b.uv_index ? a : b), chartHours[0]);

    const rawAppUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim();
    const vercelUrl = (process.env.VERCEL_URL ?? "").trim();
    const appUrl = rawAppUrl.startsWith("https://")
      ? rawAppUrl
      : vercelUrl
        ? `https://${vercelUrl}`
        : "https://uv-index-seven.vercel.app";

    // Debug: call Telegram directly and return raw response
    const chatId = chatIds[0];
    const caption = `☀️ בדיקה\n🏊 ${poolFrom}:00–${poolTo}:00\n⚡ UV ${peak?.uv_index}`;
    const photoUrl = `${appUrl}/api/og/daily-uv`;

    const tgRes = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption }) }
    );
    const tgData = await tgRes.json();

    return NextResponse.json({ ok: tgRes.ok, telegram: tgData, appUrl, photoUrl, chatId });
  } catch (err) {
    console.error("Test error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
