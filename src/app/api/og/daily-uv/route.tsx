import { ImageResponse } from "next/og";
import { fetchUVForecast } from "@/lib/openmeteo";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function uvColor(uv: number): string {
  if (uv <= 2)  return "#22c55e";
  if (uv <= 5)  return "#eab308";
  if (uv <= 7)  return "#f97316";
  if (uv <= 10) return "#ef4444";
  return "#a855f7";
}

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

  // Use calibrated wttr.in data (same source as the DailyChart on the website)
  // This matches Apple Weather / user's iPhone readings
  const displayHours = forecast.today.hours.filter((h) => {
    const hr = parseInt(h.time.slice(11, 13));
    return hr >= 7 && hr <= 18;
  });

  // Use OM hourly data (1h precision) for pool window detection
  const detectionHours = (forecast.omHoursToday.length > 0
    ? forecast.omHoursToday
    : forecast.today.hours
  ).filter((h) => {
    const hr = parseInt(h.time.slice(11, 13));
    return hr >= 7 && hr <= 18;
  });

  const maxUV = Math.max(...displayHours.map((h) => h.uv_index), 1);
  const peak = displayHours.reduce((a, b) => (a.uv_index >= b.uv_index ? a : b), displayHours[0]);

  // Pool window using calibrated detection threshold UV≥9
  const poolHours = detectionHours.filter((h) => h.uv_index >= 9);
  const poolFrom  = poolHours[0]     ? parseInt(poolHours[0].time.slice(11, 13))          : null;
  const poolTo    = poolHours.at(-1) ? parseInt(poolHours.at(-1)!.time.slice(11, 13)) + 1 : null;

  // Date in Hebrew — reversed for SVG LTR rendering workaround
  const now = new Date();
  const dayName = now.toLocaleDateString("he-IL", { weekday: "long", timeZone: "Asia/Jerusalem" });
  const dayNum  = now.toLocaleDateString("he-IL", { day: "numeric", month: "long", timeZone: "Asia/Jerusalem" });
  // Build date as separate parts so we can control visual order in LTR SVG
  const dateDisplay = `${dayNum} ,${dayName}`;

  const W = 800, H = 400;
  const PL = 36, PR = 20, PT = 76, PB = 48;
  const CW = W - PL - PR;
  const CH = H - PT - PB;
  const n = displayHours.length;

  const pts = displayHours.map((h, i) => ({
    x: PL + (n > 1 ? (i / (n - 1)) : 0) * CW,
    y: PT + CH - Math.min(h.uv_index / maxUV, 1) * CH,
  }));

  const linePath = buildPath(pts);
  const fillPath = pts.length >= 2
    ? `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(PT + CH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(PT + CH).toFixed(1)} Z`
    : "";

  const strokeColor = uvColor(peak?.uv_index ?? 0);
  const peakIdx = peak ? displayHours.findIndex((h) => h.time === peak.time) : -1;

  // X labels — every other hour
  const xLabels = displayHours
    .map((h, i) => ({ hr: parseInt(h.time.slice(11, 13)), x: pts[i].x }))
    .filter((_, i) => i % 2 === 0);

  // Grid Y values
  const gridVals = [3, 6, 9, 11].filter((v) => v <= maxUV + 1);

  const poolText = poolFrom !== null && poolTo !== null
    ? `${poolFrom}:00–${poolTo}:00 (UV ≥ 9) 🏊`
    : "UV לא מגיע ל-9 היום 🏊";
  const peakText = peak
    ? `UV ${peak.uv_index.toFixed(0)} · ${parseInt(peak.time.slice(11, 13))}:00 שיא ⚡`
    : "";

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${CH + PB + 4}" viewBox="0 0 ${W} ${CH + PB + 4}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${strokeColor}" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="${strokeColor}" stop-opacity="0.02"/>
    </linearGradient>
  </defs>
  ${gridVals.map((v) => {
    const gy = (CH - (v / maxUV) * CH);
    return `<line x1="${PL}" y1="${gy.toFixed(1)}" x2="${(W - PR).toFixed(1)}" y2="${gy.toFixed(1)}" stroke="#dbeaf4" stroke-width="1" stroke-dasharray="4,4"/>
            <text x="${(PL - 6).toFixed(1)}" y="${(gy + 4).toFixed(1)}" text-anchor="end" font-size="13" fill="#8fafc0" font-family="system-ui,sans-serif">${v}</text>`;
  }).join("")}
  ${fillPath ? `<path d="${fillPath}" fill="url(#g)"/>` : ""}
  <path d="${linePath}" fill="none" stroke="${strokeColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  ${peakIdx >= 0 && pts[peakIdx] ? `<circle cx="${pts[peakIdx].x.toFixed(1)}" cy="${pts[peakIdx].y.toFixed(1)}" r="5" fill="${strokeColor}" stroke="white" stroke-width="2"/>` : ""}
  ${xLabels.map(({ hr, x }) => `<text x="${x.toFixed(1)}" y="${(CH + 22).toFixed(1)}" text-anchor="middle" font-size="13" fill="#8fafc0" font-family="system-ui,sans-serif">${hr}:00</text>`).join("")}
</svg>`;

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: W, height: H, background: "#f0f7fc", fontFamily: "system-ui,sans-serif" }}>

        {/* Header — LTR layout, date manually ordered for visual correctness */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px 0 24px" }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#0c1b29" }}>&#9728;&#65039; UV Pool</span>
          <span style={{ fontSize: 15, color: "#4a6a80" }}>{dateDisplay}</span>
        </div>

        {/* Chart */}
        <div style={{ display: "flex" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            width={W}
            height={CH + PB + 4}
            alt=""
            src={`data:image/svg+xml,${encodeURIComponent(svgContent)}`}
          />
        </div>

        {/* Footer — pool window + peak, written LTR to avoid bidi issues */}
        <div style={{ display: "flex", gap: 28, padding: "6px 24px 14px 24px" }}>
          <span style={{ fontSize: 16, color: "#0a73ad", fontWeight: 700 }}>{poolText}</span>
          {peakText && <span style={{ fontSize: 16, color: "#c0392b", fontWeight: 700 }}>{peakText}</span>}
        </div>

      </div>
    ),
    { width: W, height: H }
  );
}
