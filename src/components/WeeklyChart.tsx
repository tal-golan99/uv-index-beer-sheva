"use client";

import { getUVLevel, dayNameHe } from "@/lib/uv";
import type { DailyUV } from "@/types";

interface Props {
  week: DailyUV[];
}

function DayCard({ day, isToday }: { day: DailyUV; isToday: boolean }) {
  const level = getUVLevel(day.max_uv);
  const barPct = Math.min(day.max_uv / 11, 1) * 100;
  const dateLabel = new Date(day.date + "T12:00:00").toLocaleDateString("he-IL", {
    day: "numeric",
    month: "numeric",
  });

  return (
    <div
      className="flex-shrink-0 flex flex-col items-center gap-2 rounded-2xl p-4 transition-all duration-200 hover:scale-[1.03] cursor-default bg-white"
      style={{
        minWidth: "84px",
        border: `1px solid ${isToday ? level.color : "var(--color-pool-100)"}`,
        boxShadow: isToday
          ? `0 10px 24px -10px ${level.color}`
          : "0 4px 12px -8px rgba(2,132,199,0.4)",
      }}
    >
      <p className="text-xs font-bold text-[color:var(--color-ink-2)]">{dayNameHe(day.date)}</p>
      <p className="text-[10px] text-[color:var(--color-ink-3)]">{dateLabel}</p>

      {/* UV bar */}
      <div className="w-full h-1.5 rounded-full" style={{ background: "var(--color-pool-100)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${barPct}%`, backgroundColor: level.color }}
        />
      </div>

      {/* UV value */}
      <p className="text-xl font-black tabular-nums" style={{ color: level.color }}>
        {day.max_uv.toFixed(1)}
      </p>

      {isToday && (
        <span
          className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
          style={{ background: level.color }}
        >
          היום
        </span>
      )}
    </div>
  );
}

export default function WeeklyChart({ week }: Props) {
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-[color:var(--color-pool-100)] shadow-sm">
      <h2 className="text-base font-extrabold text-[color:var(--color-ink)] mb-4">תחזית שבועית</h2>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide" style={{ touchAction: "pan-x" }}>
        {week.map((day) => (
          <DayCard key={day.date} day={day} isToday={day.date === todayStr} />
        ))}
      </div>
    </div>
  );
}
