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

/** Generate a smooth cubic-bezier SVG path through points (midpoint control point algorithm). */
function smoothLinePath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cp = (pts[i - 1].x + pts[i].x) / 2;
    d += ` C ${cp} ${pts[i - 1].y}, ${cp} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
  }
  return d;
}

/** Closed fill path: smooth curve + close down to bottom edge. */
function smoothFillPath(pts: { x: number; y: number }[], chartBottom: number): string {
  if (pts.length < 2) return "";
  const line = smoothLinePath(pts);
  return `${line} L ${pts[pts.length - 1].x} ${chartBottom} L ${pts[0].x} ${chartBottom} Z`;
}

export async function GET() {
  const forecast = await fetchUVForecast();

  // Use Open-Meteo hourly data (1h resolution) for the chart
  const rawHours: HourlyUV[] = forecast.omHoursToday.length > 0
    ? forecast.omHoursToday
    : forecast.today.hours;

  const chartHours = rawHours.filter((h) => {
    const hr = parseInt(h.time.slice(11, 13));
    return hr >= 7 && hr <= 18;
  });

  const maxUV = Math.max(...chartHours.map((h) => h.uv_index), 1);
  const peak = chartHours.reduce((a, b) => (a.uv_index >= b.uv_index ? a : b), chartHours[0]);

  // Pool window using UV >= 8 threshold
  const poolHours = chartHours.filter((h) => h.uv_index >= 8);
  const poolFrom  = poolHours[0]    ? parseInt(poolHours[0].time.slice(11, 13))      : null;
  const poolTo    = poolHours.at(-1) ? parseInt(poolHours.at(-1)!.time.slice(11, 13)) + 1 : null;

  const dateLabel = new Date().toLocaleDateString("he-IL", {
    weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Jerusalem",
  });

  // Chart canvas dimensions
  const W = 800, H = 420;
  const PAD_L = 20, PAD_R = 20, PAD_TOP = 100, PAD_BOT = 60;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_TOP - PAD_BOT;
  const chartBottom = PAD_TOP + chartH;

  const n = chartHours.length;
  const pts = chartHours.map((h, i) => ({
    x: PAD_L + (i / (n - 1)) * chartW,
    y: PAD_TOP + chartH - (h.uv_index / maxUV) * chartH,
  }));

  const strokeColor = uvColor(peak?.uv_index ?? 0);
  const linePath = smoothLinePath(pts);
  const fillPath = smoothFillPath(pts, chartBottom);

  // X-axis labels — show every 2 hours
  const xLabels = chartHours
    .map((h, i) => ({ hr: parseInt(h.time.slice(11, 13)), x: pts[i].x }))
    .filter((_, i) => i % 2 === 0);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: W,
          height: H,
          background: "#f0f7fc",
          padding: "0",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Header — LTR layout to avoid Satori bidi issues */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "22px 28px 12px 28px",
          }}
        >
          <span style={{ fontSize: 24, fontWeight: 800, color: "#0c1b29", letterSpacing: "-0.5px" }}>
            ☀️ UV Pool
          </span>
          <span style={{ fontSize: 17, color: "#3c5161" }}>{dateLabel}</span>
        </div>

        {/* Chart area */}
        <div style={{ display: "flex", flex: 1, position: "relative" }}>
          {/* SVG chart */}
          <svg
            width={W}
            height={chartH + PAD_BOT}
            style={{ position: "absolute", top: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0.03" />
              </linearGradient>
            </defs>

            {/* Horizontal grid lines */}
            {[3, 6, 9, 11].map((v) => {
              const gy = chartH - (v / maxUV) * chartH;
              return (
                <g key={v}>
                  <line
                    x1={PAD_L} y1={gy} x2={W - PAD_R} y2={gy}
                    stroke="#dbeaf4" strokeWidth="1" strokeDasharray="4,4"
                  />
                  <text x={PAD_L - 4} y={gy + 4} textAnchor="end" fontSize="12" fill="#7fa3bc">
                    {v}
                  </text>
                </g>
              );
            })}

            {/* Fill area */}
            <path d={fillPath} fill="url(#areaGrad)" />

            {/* Stroke curve */}
            <path
              d={linePath}
              fill="none"
              stroke={strokeColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Peak dot */}
            {peak && pts[chartHours.indexOf(peak)] && (
              <circle
                cx={pts[chartHours.indexOf(peak)].x}
                cy={pts[chartHours.indexOf(peak)].y}
                r="6"
                fill={strokeColor}
                stroke="white"
                strokeWidth="2"
              />
            )}

            {/* X-axis hour labels */}
            {xLabels.map(({ hr, x }) => (
              <text key={hr} x={x} y={chartH + 22} textAnchor="middle" fontSize="13" fill="#7fa3bc">
                {hr}:00
              </text>
            ))}
          </svg>
        </div>

        {/* Footer summary */}
        <div
          style={{
            display: "flex",
            gap: 24,
            padding: "10px 28px 18px 28px",
            marginTop: "auto",
          }}
        >
          {poolFrom !== null && poolTo !== null ? (
            <span style={{ fontSize: 17, color: "#0a73ad", fontWeight: 700 }}>
              {`🏊 ${poolFrom}:00–${poolTo}:00 (UV ≥ 9)`}
            </span>
          ) : (
            <span style={{ fontSize: 17, color: "#6a8295" }}>🏊 UV לא מגיע ל-9 היום</span>
          )}
          {peak && (
            <span style={{ fontSize: 17, color: "#b91c1c", fontWeight: 700 }}>
              {`⚡ שיא: ${parseInt(peak.time.slice(11, 13))}:00 · UV ${peak.uv_index.toFixed(0)}`}
            </span>
          )}
        </div>
      </div>
    ),
    { width: W, height: H }
  );
}
