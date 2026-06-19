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
    const poolHours = chartHours.filter((h) => h.uv_index >= 9);
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

    await notifyMorningForecast(chatIds, {
      poolFrom,
      poolTo,
      peakHour: peak ? parseInt(peak.time.slice(11, 13)) : null,
      peakUV: peak?.uv_index ?? null,
      funnyLine: `🧪 הודעת בדיקה | ${getMorningMessage(now)}`,
      chartUrl: `${appUrl}/api/og/daily-uv?t=${Date.now()}`,
      inviteButtonUrl: appUrl,
    });

    const wcMsg = await buildWCMessage();
    if (wcMsg) await broadcastText(chatIds, wcMsg);

    return NextResponse.json({
      ok: true,
      sentTo: chatIds,
      poolWindow: poolFrom !== null && poolTo !== null ? `${poolFrom}:00–${poolTo}:00` : null,
      wcIncluded: !!wcMsg,
    });
  } catch (err) {
    console.error("Test error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
