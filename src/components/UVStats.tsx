"use client";

import { Sun, Clock } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { getUVLevel } from "@/lib/uv";
import type { DailyUV } from "@/types";

interface Props {
  today: DailyUV;
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

function StatCard({ icon, label, value, sub, color }: StatCardProps) {
  return (
    <div className="radius-card shadow-pool-md flex flex-col items-center gap-1.5 bg-white p-5 text-center ring-1 ring-[color:var(--color-pool-100)] md:p-6">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-[color:var(--color-pool-50)]">
        {icon}
      </span>
      <p dir="rtl" className="mt-1 text-sm font-semibold text-[color:var(--color-ink-2)] md:text-base">{label}</p>
      <p
        className="text-2xl font-black leading-none text-[color:var(--color-ink)] sm:text-3xl md:text-4xl tabular-nums"
        style={color ? { color } : {}}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-[color:var(--color-ink-2)] md:text-sm">{sub}</p>}
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
  // Slice directly from the ISO string (YYYY-MM-DDTHH:mm:ss) — already Jerusalem-local
  // time from Open-Meteo. Using new Date() here would parse as UTC on Node.js (server)
  // but as local time in the browser, causing a hydration mismatch.
  const peakTime = peakHour ? peakHour.time.slice(11, 16) : "—";

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        icon={<Sun size={26} weight="duotone" color={level.color} />}
        label="UV מקסימום היום"
        value={maxUV.toFixed(1)}
        color={level.colorText}
      />
      <StatCard
        icon={<Clock size={26} weight="duotone" color="var(--color-pool-600)" />}
        label="שעת שיא"
        value={peakTime}
      />
    </div>
  );
}
