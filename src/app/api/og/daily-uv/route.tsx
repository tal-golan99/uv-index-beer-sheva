import { ImageResponse } from "next/og";
import { fetchUVForecast } from "@/lib/openmeteo";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function buildPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 2] ?? pts[i - 1];
    const p1 = pts[i - 1];
    const p2 = pts[i];
    const p3 = pts[i + 1] ?? pts[i];
    // Catmull-Rom → cubic bezier (tension 0.5)
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export async function GET() {
  const forecast = await fetchUVForecast();

  const allHours = forecast.omHoursToday.length > 0 ? forecast.omHoursToday : forecast.today.hours;
  const displayHours = allHours.filter((h) => {
    const hr = parseInt(h.time.slice(11, 13));
    return hr >= 6 && hr <= 20;
  });
  const detectionHours = allHours.filter((h) => {
    const hr = parseInt(h.time.slice(11, 13));
    return hr >= 8 && hr <= 17;
  });

  const peak = displayHours.length
    ? displayHours.reduce((a, b) => (a.uv_index >= b.uv_index ? a : b))
    : null;

  const poolHours = detectionHours.filter((h) => h.uv_index >= 9);
  const poolFrom  = poolHours[0]     ? parseInt(poolHours[0].time.slice(11, 13))          : null;
  const poolTo    = poolHours.at(-1) ? parseInt(poolHours.at(-1)!.time.slice(11, 13)) + 1 : null;

  const now = new Date();
  const dateDisplay = now.toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Jerusalem",
  });

  // Chart dimensions
  const W = 800, H = 420;
  const LABEL_W = 28;  // Y-axis label column width
  const LABEL_H = 20;  // X-axis label row height
  const chartW = W - 48 - LABEL_W; // total img width minus padding minus Y labels
  const chartH = H - 80 - LABEL_H; // total height minus header/footer minus X labels
  const PT = 12, PB = 8;           // inner SVG padding top/bottom (no room needed for text)
  const PL = 8, PR = 8;            // inner SVG padding left/right

  const CW = chartW - PL - PR;
  const CH = chartH - PT - PB;
  const Y_MAX = 13;

  const n = displayHours.length;
  const pts = displayHours.map((h, i) => ({
    x: PL + (n > 1 ? (i / (n - 1)) : 0) * CW,
    y: PT + CH - Math.min(Math.max(h.uv_index / Y_MAX, 0), 1) * CH,
  }));

  const linePath = buildPath(pts);
  const fillPath = pts.length >= 2
    ? `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(PT + CH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(PT + CH).toFixed(1)} Z`
    : "";

  // Grid lines only (no text — Satori doesn't render SVG text in data-URI imgs)
  const gridLines = [3, 6, 9, 12].map((v) => {
    const gy = PT + CH - (v / Y_MAX) * CH;
    return `<line x1="${PL}" y1="${gy.toFixed(1)}" x2="${(PL + CW).toFixed(1)}" y2="${gy.toFixed(1)}" stroke="rgba(2,132,199,0.18)" stroke-width="1" stroke-dasharray="3 6"/>`;
  }).join("\n");

  // Peak dot
  const peakIdx = peak ? displayHours.findIndex((h) => h.time === peak.time) : -1;
  const peakDot = peakIdx >= 0 && pts[peakIdx]
    ? `<circle cx="${pts[peakIdx].x.toFixed(1)}" cy="${pts[peakIdx].y.toFixed(1)}" r="5" fill="#ef4444" stroke="white" stroke-width="2"/>`
    : "";

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${chartW}" height="${chartH}" viewBox="0 0 ${chartW} ${chartH}">
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
  <rect x="0" y="0" width="${chartW}" height="${chartH}" fill="white" rx="12"/>
  ${gridLines}
  ${fillPath ? `<path d="${fillPath}" fill="url(#uvFill)"/>` : ""}
  <path d="${linePath}" fill="none" stroke="url(#uvStroke)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  ${peakDot}
</svg>`;

  // Y-axis label values and their pixel positions within the SVG
  const yLabels = [12, 9, 6, 3].map((v) => ({
    value: v,
    pct: 1 - v / Y_MAX, // 0 = top, 1 = bottom
  }));

  // X-axis: show hours at ~3h intervals
  const xLabels = displayHours
    .map((h, i) => ({ hr: parseInt(h.time.slice(11, 13)), i }))
    .filter(({ hr }) => hr % 3 === 0);

  const poolText = poolFrom !== null && poolTo !== null ? `${poolFrom}:00–${poolTo}:00 🏊` : "";
  const peakText = peak
    ? `UV ${peak.uv_index.toFixed(0)} · ${parseInt(peak.time.slice(11, 13))}:00 peak ⚡`
    : "";

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: W, height: H, background: "#f0f7fc", fontFamily: "system-ui,sans-serif", padding: "20px 24px 16px 24px", gap: 10 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#0c1b29" }}>&#9728;&#65039; UV Pool</span>
          <span style={{ fontSize: 15, color: "#4a6a80" }}>{dateDisplay}</span>
        </div>

        {/* Chart + labels */}
        <div style={{ display: "flex", flex: 1, flexDirection: "column" }}>

          {/* Row: Y-labels + SVG chart */}
          <div style={{ display: "flex", flex: 1 }}>

            {/* Y-axis labels */}
            <div style={{ display: "flex", flexDirection: "column", width: LABEL_W, alignItems: "flex-end", paddingRight: 4, paddingTop: PT, paddingBottom: PB, justifyContent: "space-between" }}>
              {yLabels.map(({ value }) => (
                <span key={value} style={{ fontSize: 11, color: "#5f7787", lineHeight: "1" }}>{value}</span>
              ))}
            </div>

            {/* SVG chart (no text — labels are in JSX) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              width={chartW}
              height={chartH}
              alt=""
              src={`data:image/svg+xml,${encodeURIComponent(svgContent)}`}
              style={{ borderRadius: 12, boxShadow: "0 1px 6px rgba(2,132,199,0.10)", flex: 1 }}
            />
          </div>

          {/* X-axis labels */}
          <div style={{ display: "flex", paddingLeft: LABEL_W, height: LABEL_H, position: "relative" }}>
            {xLabels.map(({ hr, i }) => {
              const pct = n > 1 ? i / (n - 1) : 0;
              return (
                <span
                  key={hr}
                  style={{
                    position: "absolute",
                    left: `${(PL / chartW + pct * (CW / chartW)) * 100}%`,
                    fontSize: 10,
                    color: "#5f7787",
                    transform: "translateX(-50%)",
                    top: 4,
                  }}
                >
                  {String(hr).padStart(2, "0")}:00
                </span>
              );
            })}
          </div>

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
