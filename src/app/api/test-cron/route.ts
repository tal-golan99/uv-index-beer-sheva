import { NextRequest, NextResponse } from "next/server";
import { fetchUVForecast } from "@/lib/openmeteo";
import { getActiveProfileSubscribers } from "@/lib/supabase";
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

    const chatIds = subscribers.map((s) => s.telegram_chat_id!).filter(Boolean);

    if (!chatIds.length) {
      return NextResponse.json({ error: "No Telegram chat IDs found", subscriberCount: subscribers.length });
    }

    // Use Open-Meteo hourly data (24pts) for pool window — wttr.in is 3h-sampled (too coarse)
    const allHours = forecast.omHoursToday.length > 0 ? forecast.omHoursToday : forecast.today.hours;
    const chartHours = allHours.filter((h) => {
      const hr = parseInt(h.time.slice(11, 13));
      return hr >= 8 && hr <= 17;
    });
    const poolHours = chartHours.filter((h) => h.uv_index >= 8);
    const poolFrom = poolHours[0] ? parseInt(poolHours[0].time.slice(11, 13)) : null;
    const poolTo   = poolHours.at(-1) ? parseInt(poolHours.at(-1)!.time.slice(11, 13)) + 1 : null;
    const peak     = chartHours.reduce((a, b) => (a.uv_index >= b.uv_index ? a : b), chartHours[0]);
    const peakHour = peak ? parseInt(peak.time.slice(11, 13)) : null;

    const poolLine = poolFrom !== null && poolTo !== null
      ? `🏊 זמן בריכה: ${poolFrom}:00–${poolTo}:00 (UV ≥ 9)`
      : "";
    const peakLine = peakHour !== null && peak ? `⚡ שיא: ${peakHour}:00 עם UV ${peak.uv_index}` : "";
    const funnyLine = getMorningMessage(now);

    const caption = [
      "☀️ בוקר טוב לכל השזופים והשזופות ☀️",
      "",
      poolLine,
      peakLine,
      "",
      funnyLine,
      "",
      "🧪 הודעת בדיקה",
    ].filter(Boolean).join("\n");

    // Fetch chart image from local server and send as a file upload
    // (Telegram can't fetch localhost URLs, but we CAN upload raw bytes)
    const port = process.env.PORT ?? "3000";
    const localChartUrl = `http://localhost:${port}/api/og/daily-uv`;
    let chartBuffer: ArrayBuffer | null = null;
    try {
      const chartRes = await fetch(localChartUrl);
      if (chartRes.ok) chartBuffer = await chartRes.arrayBuffer();
    } catch {
      // Chart fetch failed — will fall back to text message
    }

    const testChatId = chatIds[0];
    let testRes: Response;

    if (chartBuffer) {
      const form = new FormData();
      form.append("chat_id", testChatId);
      form.append("caption", caption);
      form.append("photo", new Blob([chartBuffer], { type: "image/png" }), "uv-chart.png");
      testRes = await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`,
        { method: "POST", body: form }
      );
    } else {
      testRes = await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: testChatId, text: caption }),
        }
      );
    }

    const testData = await testRes.json();
    if (!testRes.ok) {
      return NextResponse.json({ error: "Telegram API failed", telegramError: testData });
    }

    return NextResponse.json({
      ok: true,
      chatIds: chatIds.length,
      sentTo: testChatId,
      withChart: chartBuffer !== null,
      poolWindow: `${poolFrom}:00–${poolTo}:00`,
    });
  } catch (err) {
    console.error("Test error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
