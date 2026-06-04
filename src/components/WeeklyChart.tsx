"use client";

import { useEffect, useState } from "react";
import { getUVLevel, dayNameHe } from "@/lib/uv";
import type { DailyUV } from "@/types";

interface Props {
  week: DailyUV[];
  /** Israel-local date (YYYY-MM-DD), passed from the server to avoid hydration drift. */
  today: string;
}

// Top of the bar scale. UV rarely exceeds this in Beer Sheva; clamps keep bars sane.
const BAR_MAX = 11;

/**
 * Seven-day forecast as a compact column chart: bar HEIGHT encodes the day's max UV
 * and bar COLOR encodes severity, so the week's shape reads at a glance instead of as
 * seven identical tiles. The number stays in the adaptive ink token (not the level's
 * dark text variant) so it survives night mode, where the panel darkens.
 */
export default function WeeklyChart({ week, today }: Props) {
  const [grown, setGrown] = useState(false);

  // Grow the bars from the baseline once mounted (skipped instantly under reduced motion,
  // since a 0%→pct height change with no transition is imperceptible).
  useEffect(() => {
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section className="space-y-3">
      <h2 className="display-title px-1 text-lg text-[color:var(--color-ink)]">תחזית שבועית</h2>

      <div className="radius-nested bg-white p-4 ring-1 ring-[color:var(--color-pool-100)] shadow-pool-sm sm:p-5">
        {/* dir=ltr so the days run chronologically left → right */}
        <div className="flex items-end gap-1.5 sm:gap-2" dir="ltr">
          {week.map((day) => {
            const level = getUVLevel(day.max_uv);
            const isToday = day.date === today;
            const pct = Math.min(day.max_uv / BAR_MAX, 1) * 100;
            const dateLabel = `${day.date.slice(8, 10)}/${day.date.slice(5, 7)}`;

            return (
              <div
                key={day.date}
                className="flex flex-1 flex-col items-center gap-2 rounded-xl py-2"
                style={isToday ? { background: level.bg } : undefined}
              >
                <span className="text-sm font-black tabular-nums text-[color:var(--color-ink)]">
                  {day.max_uv.toFixed(1)}
                </span>

                {/* Vertical track + color-coded fill */}
                <div
                  className="relative h-24 w-2.5 overflow-hidden rounded-full sm:w-3"
                  style={{ background: "var(--color-pool-100)" }}
                >
                  <div
                    className="absolute inset-x-0 bottom-0 rounded-full"
                    style={{
                      height: grown ? `${pct}%` : "0%",
                      background: level.color,
                      transition: "height 600ms var(--ease-out-expo)",
                    }}
                  />
                </div>

                <span
                  className={`whitespace-nowrap text-[10px] text-[color:var(--color-ink-2)] sm:text-[11px] ${
                    isToday ? "font-extrabold" : "font-bold"
                  }`}
                >
                  {dayNameHe(day.date)}
                </span>
                <span className="text-[10px] text-[color:var(--color-ink-3)]">{dateLabel}</span>

                {/* Fixed-height slot keeps every column the same height with or without the badge */}
                <div className="flex h-4 items-center">
                  {isToday && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[9px] font-bold text-white"
                      style={{ background: level.colorText }}
                    >
                      היום
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
