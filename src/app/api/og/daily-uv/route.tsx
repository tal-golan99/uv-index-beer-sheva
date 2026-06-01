import { ImageResponse } from "next/og";
import { fetchUVForecast } from "@/lib/openmeteo";
import type { HourlyUV } from "@/types";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function uvColor(uv: number): string {
  if (uv <= 2)  return "#22c55e";
  if (uv <= 5)  return "#eab308";
  if (uv <= 7)  return "#f97316";
  if (uv <= 10) return "#ef4444";
  return "#a855f7";
}

/** Smooth cubic bezier path through points using midpoint control points. */
function buildPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const cp = ((pts[i - 1].x + pts[i].x) / 2).toFixed(1);
    d += ` C ${cp} ${pts[i - 1].y.toFixed(1)}, ${cp} ${pts[i].y.toFixed(1)}, ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
  }
  return d;
}

export async function GET() {
  const forecast = await fetchUVForecast();

  const rawHours: HourlyUV[] = forecast.omHoursToday.length > 0
    ? forecast.omHoursToday
    : forecast.today.hours;

  const chartHours = rawHours.filter((h) => {
    const hr = parseInt(h.time.slice(11, 13));
    return hr >= 7 && hr <= 18;
  });

  const maxUV = Math.max(...chartHours.map((h) => h.uv_index), 1);
  const peak = chartHours.reduce((a, b) => (a.uv_index >= b.uv_index ? a : b), chartHours[0]);

  const poolHours = chartHours.filter((h) => h.uv_index >= 8);
  const poolFrom  = poolHours[0]     ? parseInt(poolHours[0].time.slice(11, 13))          : null;
  const poolTo    = poolHours.at(-1) ? parseInt(poolHours.at(-1)!.time.slice(11, 13)) + 1 : null;

  const dateLabel = new Date().toLocaleDateString("he-IL", {
    weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Jerusalem",
  });

  const W = 800, H = 400;
  const PL = 28, PR = 28, PT = 80, PB = 50;
  const CW = W - PL - PR;
  const CH = H - PT - PB;
  const n = chartHours.length;

  const pts = chartHours.map((h, i) => ({
    x: PL + (n > 1 ? (i / (n - 1)) : 0) * CW,
    y: PT + CH - (h.uv_index / maxUV) * CH,
  }));

  const linePath = buildPath(pts);
  const fillPath = pts.length >= 2
    ? `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(PT + CH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(PT + CH).toFixed(1)} Z`
    : "";

  const strokeColor = uvColor(peak?.uv_index ?? 0);

  // X-axis labels every 2 hours
  const xLabels = chartHours
    .map((h, i) => ({ hr: parseInt(h.time.slice(11, 13)), x: pts[i].x }))
    .filter((_, i) => i % 2 === 0);

  // Peak index for dot
  const peakIdx = peak ? chartHours.findIndex((h) => h.time === peak.time) : -1;

  const poolText = poolFrom !== null && poolTo !== null
    ? `🏊 ${poolFrom}:00–${poolTo}:00 (UV ≥ 9)`
    : "🏊 UV לא מגיע ל-9 היום";

  const peakText = peak
    ? `⚡ שיא: ${parseInt(peak.time.slice(11, 13))}:00 · UV ${peak.uv_index.toFixed(0)}`
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: W,
          height: H,
          background: "#f0f7fc",
          fontFamily: "sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 28px 0 28px" }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: "#0c1b29" }}>☀️ UV Pool</span>
          <span style={{ fontSize: 16, color: "#3c5161" }}>{dateLabel}</span>
        </div>

        {/* Chart rendered as SVG string via img tag — avoids Satori flexbox/SVG conflicts */}
        <div style={{ display: "flex", flex: 1, padding: "10px 0 0 0" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            width={W}
            height={CH + PB}
            alt=""
            src={`data:image/svg+xml,${encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${CH + PB}" viewBox="0 0 ${W} ${CH + PB}">
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="${strokeColor}" stop-opacity="0.35"/>
                  <stop offset="100%" stop-color="${strokeColor}" stop-opacity="0.02"/>
                </linearGradient>
              </defs>
              ${[3, 6, 9].map((v) => {
                const gy = (CH - (v / maxUV) * CH);
                return `<line x1="${PL}" y1="${gy}" x2="${W - PR}" y2="${gy}" stroke="#dbeaf4" stroke-width="1" stroke-dasharray="4,4"/>
                        <text x="${PL - 4}" y="${gy + 4}" text-anchor="end" font-size="12" fill="#7fa3bc" font-family="sans-serif">${v}</text>`;
              }).join("")}
              ${fillPath ? `<path d="${fillPath.replace(/"/g, "'")}" fill="url(#g)"/>` : ""}
              <path d="${linePath.replace(/"/g, "'")}" fill="none" stroke="${strokeColor}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
              ${peakIdx >= 0 ? `<circle cx="${pts[peakIdx].x.toFixed(1)}" cy="${pts[peakIdx].y.toFixed(1)}" r="6" fill="${strokeColor}" stroke="white" stroke-width="2"/>` : ""}
              ${xLabels.map(({ hr, x }) => `<text x="${x.toFixed(1)}" y="${CH + 22}" text-anchor="middle" font-size="13" fill="#7fa3bc" font-family="sans-serif">${hr}:00</text>`).join("")}
            </svg>`
            )}`}
          />
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 24, padding: "8px 28px 16px 28px" }}>
          <span style={{ fontSize: 17, color: "#0a73ad", fontWeight: 700 }}>{poolText}</span>
          {peakText && (
            <span style={{ fontSize: 17, color: "#b91c1c", fontWeight: 700 }}>{peakText}</span>
          )}
        </div>
      </div>
    ),
    { width: W, height: H }
  );
}
