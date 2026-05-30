"use client";

import { useState, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { getUVLevel } from "@/lib/uv";
import type { HourlyUV } from "@/types";

interface Props {
  hours: HourlyUV[];
}

function formatHour(iso: string): string {
  const h = new Date(iso).getHours();
  return `${h.toString().padStart(2, "0")}:00`;
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; payload: HourlyUV & { hour: string } }[];
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const uv = payload[0].value;
  const level = getUVLevel(uv);
  return (
    <div className="rounded-xl px-4 py-3 shadow-xl bg-white ring-1 ring-[color:var(--color-pool-200)]">
      <p className="text-xs text-[color:var(--color-ink-3)] mb-1">{payload[0].payload.hour}</p>
      <p className="text-2xl font-black leading-none" style={{ color: level.color }}>
        {uv.toFixed(1)}
      </p>
      <p className="text-xs mt-1" style={{ color: level.color }}>שמש {level.label}</p>
    </div>
  );
}

// UV-scale gradient stops, mapped top→bottom of the [0,12] axis (UV 12 → UV 0).
const UV_STROKE_STOPS = [
  { offset: "0%",   color: "#a855f7" }, // extreme (purple)
  { offset: "17%",  color: "#ef4444" }, // ~UV 10 (red)
  { offset: "42%",  color: "#f97316" }, // ~UV 7 (orange)
  { offset: "58%",  color: "#eab308" }, // ~UV 5 (yellow)
  { offset: "83%",  color: "#22c55e" }, // ~UV 2 (green)
  { offset: "100%", color: "#22c55e" },
];

export default function DailyChart({ hours }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const nowHour = new Date().getHours();

  const data = hours.map((h) => ({ ...h, hour: formatHour(h.time) }));
  const activeIdx = hovered ?? nowHour;
  const activeUV = data[activeIdx]?.uv_index ?? 0;
  const activeLevel = getUVLevel(activeUV);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onMouseMove = useCallback((state: any) => {
    const idx = state?.activeTooltipIndex;
    if (typeof idx === "number") setHovered(idx);
  }, []);

  const onMouseLeave = useCallback(() => setHovered(null), []);

  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-[color:var(--color-pool-100)] shadow-sm">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="text-base font-extrabold text-[color:var(--color-ink)]">מדד UV היום</h2>
          <p className="text-xs text-[color:var(--color-ink-3)] mt-0.5">געו בגרף לצפייה לפי שעה</p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black tabular-nums" style={{ color: activeLevel.color }}>
            {activeUV.toFixed(1)}
          </span>
          <p className="text-xs mt-0.5 text-[color:var(--color-ink-3)]">
            {data[activeIdx]?.hour ?? ""}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          data={data}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
        >
          <defs>
            {/* Stroke follows the UV scale: green (low) → purple (extreme) by height */}
            <linearGradient id="uvStroke" x1="0" y1="0" x2="0" y2="1">
              {UV_STROKE_STOPS.map((s) => (
                <stop key={s.offset} offset={s.offset} stopColor={s.color} />
              ))}
            </linearGradient>
            {/* Matching translucent fill */}
            <linearGradient id="uvFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#a855f7" stopOpacity={0.35} />
              <stop offset="17%"  stopColor="#ef4444" stopOpacity={0.30} />
              <stop offset="42%"  stopColor="#f97316" stopOpacity={0.24} />
              <stop offset="58%"  stopColor="#eab308" stopOpacity={0.18} />
              <stop offset="83%"  stopColor="#22c55e" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0.04} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="2 6" stroke="rgba(2,132,199,0.10)" vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval={3}
          />
          <YAxis
            domain={[0, 12]}
            ticks={[0, 3, 6, 9, 12]}
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "rgba(2,132,199,0.25)", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="uv_index"
            stroke="url(#uvStroke)"
            strokeWidth={3}
            fill="url(#uvFill)"
            dot={false}
            activeDot={{ r: 5, fill: activeLevel.color, stroke: "#fff", strokeWidth: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
