"use client";

import { getUVLevel, dayNameHe } from "@/lib/uv";
import type { DailyUV } from "@/types";

interface Props {
  week: DailyUV[];
  /** Israel-local date (YYYY-MM-DD), passed from the server to avoid hydration drift. */
  today: string;
}

function DayCard({ day, isToday, index }: { day: DailyUV; isToday: boolean; index: number }) {
  const level = getUVLevel(day.max_uv);
  const barPct = Math.min(day.max_uv / 11, 1) * 100;
  const dateLabel = `${day.date.slice(8, 10)}/${day.date.slice(5, 7)}`;

  return (
    <div
      className="week-day-card flex-shrink-0 sm:flex-1 min-w-[84px] flex flex-col items-center gap-2 radius-nested p-4 cursor-default"
      style={{
        background: isToday ? level.bg : "white",
        border: isToday ? `2px solid ${level.color}` : "1px solid var(--color-pool-100)",
        boxShadow: "var(--shadow-sm)",
        "--stagger": `${index * 40}ms`,
      } as React.CSSProperties}
    >
      <p className="text-xs font-bold text-[color:var(--color-ink-2)]">{dayNameHe(day.date)}</p>
      <p className="text-[10px] text-[color:var(--color-ink-2)]">{dateLabel}</p>

      {/* UV bar */}
      <div className="w-full h-1.5 rounded-full" style={{ background: "var(--color-pool-100)" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${barPct}%`, backgroundColor: level.color, transition: "width 500ms var(--ease-out-expo)" }}
        />
      </div>

      {/* UV value — uses the AA-on-white text variant for readability */}
      <p className="text-xl font-black tabular-nums" style={{ color: level.colorText }}>
        {day.max_uv.toFixed(1)}
      </p>

      {/* Reserve fixed height so all cards stay the same height regardless of badge */}
      <div className="h-5 flex items-center justify-center">
        {isToday && (
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: level.colorText }}
          >
            היום
          </span>
        )}
      </div>
    </div>
  );
}

export default function WeeklyChart({ week, today }: Props) {
  // A plain section (not an outer card) so the day items are the only card layer —
  // avoids the card-in-card pattern, matching PoolStreak / PoolPresence.
  return (
    <section className="space-y-3">
      <h2 className="display-title px-1 text-lg text-[color:var(--color-ink)]">תחזית שבועית</h2>
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide" dir="ltr" style={{ touchAction: "pan-x" }}>
          {week.map((day, index) => (
            <DayCard key={day.date} day={day} isToday={day.date === today} index={index} />
          ))}
        </div>
        {/* Fade hint: scroll is dir=ltr so overflow is on the right edge */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-10"
          style={{ background: "linear-gradient(to left, var(--color-pool-50), transparent)" }}
          aria-hidden
        />
      </div>
    </section>
  );
}
