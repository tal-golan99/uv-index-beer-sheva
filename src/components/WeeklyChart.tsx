"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { DailyUV } from "@/types";

interface Props {
  week: DailyUV[];
}

function uvColor(uv: number): string {
  if (uv >= 11) return "#a855f7";
  if (uv >= 8)  return "#ef4444";
  if (uv >= 6)  return "#f97316";
  if (uv >= 3)  return "#eab308";
  return "#22c55e";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("he-IL", { weekday: "short", day: "numeric" });
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; payload: DailyUV }[];
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const uv = payload[0].value;
  const date = payload[0].payload.date;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 shadow-xl">
      <p className="text-xs text-gray-400">{formatDate(date)}</p>
      <p className="text-2xl font-black" style={{ color: uvColor(uv) }}>
        UV מקסימום: {uv.toFixed(1)}
      </p>
    </div>
  );
}

export default function WeeklyChart({ week }: Props) {
  const data = week.map((d) => ({
    ...d,
    day: formatDate(d.date),
  }));

  return (
    <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-100">גרף שבועי — UV מקסימום</h2>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 12]}
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={9} stroke="#ef4444" strokeDasharray="4 4" />
          <Bar dataKey="max_uv" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.date} fill={uvColor(entry.max_uv)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
