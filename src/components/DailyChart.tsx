"use client";

import { useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { HourlyUV } from "@/types";

interface Props {
  hours: HourlyUV[];
}

function uvColor(uv: number): string {
  if (uv >= 11) return "#a855f7";
  if (uv >= 8)  return "#ef4444";
  if (uv >= 6)  return "#f97316";
  if (uv >= 3)  return "#eab308";
  return "#22c55e";
}

function formatHour(iso: string): string {
  return new Date(iso).toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jerusalem",
  });
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; payload: HourlyUV }[];
  label?: string;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const uv = payload[0].value;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 shadow-xl">
      <p className="text-xs text-gray-400">{formatHour(payload[0].payload.time)}</p>
      <p className="text-2xl font-black" style={{ color: uvColor(uv) }}>
        UV {uv.toFixed(1)}
      </p>
    </div>
  );
}

export default function DailyChart({ hours }: Props) {
  const nowHour = new Date().getHours();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const activeUV =
    hoveredIndex !== null
      ? hours[hoveredIndex]?.uv_index
      : hours[nowHour]?.uv_index ?? 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onMouseMove = useCallback((state: any) => {
    const idx = state?.activeTooltipIndex;
    if (typeof idx === "number") setHoveredIndex(idx);
  }, []);

  const onMouseLeave = useCallback(() => setHoveredIndex(null), []);

  const data = hours.map((h) => ({
    ...h,
    hour: formatHour(h.time),
  }));

  return (
    <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-100">גרף יומי</h2>
        <span
          className="text-3xl font-black tabular-nums"
          style={{ color: uvColor(activeUV) }}
        >
          {activeUV.toFixed(1)}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={data}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="uvGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#f97316" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="hour"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickLine={false}
            interval={3}
          />
          <YAxis
            domain={[0, 12]}
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={9} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "סף 9", fill: "#ef4444", fontSize: 11 }} />
          <Area
            type="monotone"
            dataKey="uv_index"
            stroke="#f97316"
            strokeWidth={2}
            fill="url(#uvGrad)"
            dot={false}
            activeDot={{ r: 5, fill: "#f97316" }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <p className="text-xs text-gray-500 text-center">
        העבר את העכבר על הגרף לראות UV בכל שעה
      </p>
    </div>
  );
}
