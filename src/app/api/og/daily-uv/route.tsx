import { ImageResponse } from "next/og";
import { fetchUVForecast } from "@/lib/openmeteo";

export const runtime = "edge";
export const dynamic = "force-dynamic";

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

  // Same data source as DailyChart on the website (calibrated wttr.in)
  const displayHours = forecast.today.hours.filter((h) => {
    const hr = parseInt(h.time.slice(11, 13));
    return hr >= 0 && hr <= 23;
  });

  // OM hourly data for pool window detection (1h precision)
  const detectionHours = (forecast.omHoursToday.length > 0
    ? forecast.omHoursToday
    : forecast.today.hours
  ).filter((h) => {
    const hr = parseInt(h.time.slice(11, 13));
    return hr >= 7 && hr <= 18;
  });

  const peak = displayHours.length
    ? displayHours.reduce((a, b) => (a.uv_index >= b.uv_index ? a : b))
    : null;

  const poolHours = detectionHours.filter((h) => h.uv_index >= 9);
  const poolFrom  = poolHours[0]     ? parseInt(poolHours[0].time.slice(11, 13))          : null;
  const poolTo    = poolHours.at(-1) ? parseInt(poolHours.at(-1)!.time.slice(11, 13)) + 1 : null;

  const now = new Date();
  const dayName = now.toLocaleDateString("he-IL", { weekday: "long", timeZone: "Asia/Jerusalem" });
  const dateNum  = now.toLocaleDateString("he-IL", { day: "numeric", month: "long", timeZone: "Asia/Jerusalem" });
  const dateDisplay = `${dateNum} ,${dayName}`;

  const W = 800, H = 400;
  const PL = 36, PR = 20, PT = 20, PB = 36;
  const CW = W - PL - PR;
  const CH = H - 80 - PT - PB; // 80px reserved for header+footer

  const Y_MAX = 12;
  const n = displayHours.length;

  const pts = displayHours.map((h, i) => ({
    x: PL + (n > 1 ? (i / (n - 1)) : 0) * CW,
    y: PT + CH - Math.min(Math.max(h.uv_index / Y_MAX, 0), 1) * CH,
  }));

  const linePath = buildPath(pts);
  const fillPath = pts.length >= 2
    ? `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(PT + CH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(PT + CH).toFixed(1)} Z`
    : "";

  // Grid lines at UV 3, 6, 9, 12 — same as DailyChart Y ticks
  const gridLines = [3, 6, 9, 12].map((v) => {
    const gy = PT + CH - (v / Y_MAX) * CH;
    return `<line x1="${PL}" y1="${gy.toFixed(1)}" x2="${(PL + CW).toFixed(1)}" y2="${gy.toFixed(1)}" stroke="rgba(2,132,199,0.10)" stroke-width="1" stroke-dasharray="2 6"/>
            <text x="${(PL - 6).toFixed(1)}" y="${(gy + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#5f7787" font-family="system-ui,sans-serif">${v}</text>`;
  }).join("\n");

  // X-axis labels — same as DailyChart (interval="preserveStartEnd" → show first and last + sparse)
  const xLabels = displayHours
    .map((h, i) => ({ hr: parseInt(h.time.slice(11, 13)), x: pts[i].x }))
    .filter((_, i, arr) => i === 0 || i === arr.length - 1 || i % 3 === 0)
    .map(({ hr, x }) =>
      `<text x="${x.toFixed(1)}" y="${(PT + CH + 20).toFixed(1)}" text-anchor="middle" font-size="10" fill="#5f7787" font-family="system-ui,sans-serif">${String(hr).padStart(2, "0")}:00</text>`
    ).join("\n");

  // Peak dot
  const peakIdx = peak ? displayHours.findIndex((h) => h.time === peak.time) : -1;
  const peakDot = peakIdx >= 0 && pts[peakIdx]
    ? `<circle cx="${pts[peakIdx].x.toFixed(1)}" cy="${pts[peakIdx].y.toFixed(1)}" r="5" fill="#ef4444" stroke="white" stroke-width="2"/>`
    : "";

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${CH + PT + PB + 4}" viewBox="0 0 ${W} ${CH + PT + PB + 4}">
  <defs>
    <linearGradient id="uvStroke" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#a855f7"/>
      <stop offset="17%"  stop-color="#ef4444"/>
      <stop offset="42%"  stop-color="#f97316"/>
      <stop offset="58%"  stop-color="#eab308"/>
      <stop offset="83%"  stop-color="#22c55e"/>
      <stop offset="100%" stop-color="#22c55e"/>
    </linearGradient>
    <linearGradient id="uvFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#a855f7" stop-opacity="0.35"/>
      <stop offset="17%"  stop-color="#ef4444" stop-opacity="0.30"/>
      <stop offset="42%"  stop-color="#f97316" stop-opacity="0.24"/>
      <stop offset="58%"  stop-color="#eab308" stop-opacity="0.18"/>
      <stop offset="83%"  stop-color="#22c55e" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#22c55e" stop-opacity="0.04"/>
    </linearGradient>
  </defs>
  <!-- white card background -->
  <rect x="0" y="0" width="${W}" height="${CH + PT + PB + 4}" fill="white" rx="16"/>
  ${gridLines}
  ${fillPath ? `<path d="${fillPath}" fill="url(#uvFill)"/>` : ""}
  <path d="${linePath}" fill="none" stroke="url(#uvStroke)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  ${peakDot}
  ${xLabels}
</svg>`;

  const poolText = poolFrom !== null && poolTo !== null
    ? `${poolFrom}:00–${poolTo}:00 (UV ≥ 9) 🏊`
    : "";
  const peakText = peak
    ? `UV ${peak.uv_index.toFixed(0)} · ${parseInt(peak.time.slice(11, 13))}:00 שיא ⚡`
    : "";

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: W, height: H, background: "#f0f7fc", fontFamily: "system-ui,sans-serif", padding: "20px 24px 16px 24px", gap: 12 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#0c1b29" }}>&#9728;&#65039; UV Pool</span>
          <span style={{ fontSize: 15, color: "#4a6a80" }}>{dateDisplay}</span>
        </div>

        {/* Chart card */}
        <div style={{ display: "flex", flex: 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            width={W - 48}
            height={CH + PT + PB + 4}
            alt=""
            src={`data:image/svg+xml,${encodeURIComponent(svgContent)}`}
            style={{ borderRadius: 16, boxShadow: "0 1px 6px rgba(2,132,199,0.10)" }}
          />
        </div>

        {/* Footer */}
        {(poolText || peakText) && (
          <div style={{ display: "flex", gap: 24 }}>
            {poolText && <span style={{ fontSize: 16, color: "#0a73ad", fontWeight: 700 }}>{poolText}</span>}
            {peakText && <span style={{ fontSize: 16, color: "#c0392b", fontWeight: 700 }}>{peakText}</span>}
          </div>
        )}

      </div>
    ),
    { width: W, height: H }
  );
}
