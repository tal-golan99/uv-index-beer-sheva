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

export async function GET() {
  const forecast = await fetchUVForecast();

  const chartHours = forecast.today.hours.filter((h) => {
    const hr = parseInt(h.time.slice(11, 13));
    return hr >= 8 && hr <= 17;
  });

  const maxUV = Math.max(...chartHours.map((h) => h.uv_index), 1);
  const CHART_H = 130;

  const peak = chartHours.reduce((a, b) => (a.uv_index >= b.uv_index ? a : b), chartHours[0]);
  const poolHours = chartHours.filter((h) => h.uv_index >= 9);
  const poolFrom  = poolHours[0]  ? parseInt(poolHours[0].time.slice(11, 13))  : null;
  const poolTo    = poolHours.at(-1) ? parseInt(poolHours.at(-1)!.time.slice(11, 13)) : null;

  const dateLabel = new Date().toLocaleDateString("he-IL", {
    weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Jerusalem",
  });

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 800,
          height: 400,
          background: "#f6fafc",
          padding: "28px 32px",
          fontFamily: "sans-serif",
          direction: "rtl",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: "#0c1b29" }}>☀️ UV Pool — תחזית יומית</span>
          <span style={{ fontSize: 17, color: "#3c5161" }}>{dateLabel}</span>
        </div>

        {/* Bar chart */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: CHART_H + 40 }}>
          {chartHours.map((h) => {
            const hr   = parseInt(h.time.slice(11, 13));
            const barH = Math.max(4, Math.round((h.uv_index / maxUV) * CHART_H));
            const col  = uvColor(h.uv_index);
            const isPeak = peak && h.time === peak.time;
            return (
              <div key={h.time} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                <span style={{ fontSize: 11, color: "#3c5161", marginBottom: 3 }}>
                  {h.uv_index > 0 ? h.uv_index.toFixed(0) : ""}
                </span>
                <div
                  style={{
                    width: "100%",
                    height: barH,
                    background: col,
                    borderRadius: 5,
                    border: isPeak ? "2.5px solid #0c1b29" : "none",
                  }}
                />
                <span style={{ fontSize: 11, color: "#6a8295", marginTop: 3 }}>{hr}</span>
              </div>
            );
          })}
        </div>

        {/* Summary row */}
        <div style={{ display: "flex", gap: 28, marginTop: 14 }}>
          {poolFrom !== null && poolTo !== null ? (
            <span style={{ fontSize: 16, color: "#0a73ad", fontWeight: 700 }}>
              🏊 זמן בריכה: {poolFrom}:00–{poolTo}:00 (UV ≥ 9)
            </span>
          ) : (
            <span style={{ fontSize: 16, color: "#6a8295" }}>🏊 UV לא מגיע ל-9 היום</span>
          )}
          {peak && (
            <span style={{ fontSize: 16, color: "#b91c1c", fontWeight: 700 }}>
              ⚡ שיא: {parseInt(peak.time.slice(11, 13))}:00 עם UV {peak.uv_index.toFixed(0)}
            </span>
          )}
        </div>
      </div>
    ),
    { width: 800, height: 400 }
  );
}
