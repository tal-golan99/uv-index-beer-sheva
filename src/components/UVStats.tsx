"use client";

import { getUVLevel } from "@/lib/uv";
import type { DailyUV } from "@/types";

interface Props {
  today: DailyUV;
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

function StatCard({ icon, label, value, sub, color }: StatCardProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-white p-5 text-center ring-1 ring-[color:var(--color-pool-100)] shadow-sm md:p-6">
      <span className="text-3xl md:text-4xl">{icon}</span>
      <p dir="rtl" className="mt-1 text-sm font-semibold text-[color:var(--color-ink-3)] md:text-base">{label}</p>
      <p
        className="text-2xl font-black leading-none text-[color:var(--color-ink)] sm:text-3xl md:text-4xl"
        style={color ? { color } : {}}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-[color:var(--color-ink-3)] md:text-sm">{sub}</p>}
    </div>
  );
}

export default function UVStats({ today }: Props) {
  const maxUV = today.max_uv;
  const level = getUVLevel(maxUV);

  const peakHour = today.hours.reduce(
    (best, h) => (h.uv_index > best.uv_index ? h : best),
    today.hours[0]
  );
  const peakTime = peakHour
    ? new Date(peakHour.time).toLocaleTimeString("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jerusalem",
      })
    : "—";

  const sunnyHours = today.hours.filter((h) => h.uv_index >= 3).length;

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard
        icon="🔆"
        label="UV מקסימום היום"
        value={maxUV.toFixed(1)}
        color={level.color}
      />
      <StatCard icon="⏰" label="שעת שיא" value={peakTime} />
      <StatCard
        icon="🏖️"
        label="שעות שמש"
        value={`${sunnyHours}`}
        sub="בסה״כ היום"
      />
    </div>
  );
}
