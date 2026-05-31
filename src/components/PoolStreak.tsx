"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

/** Today's date in Asia/Jerusalem as YYYY-MM-DD (en-CA gives ISO order). */
function jerusalemToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
}

/** YYYY-MM-DD → DD/MM (the string is already zero-padded by en-CA). */
function toDDMM(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

/** Whole-day difference between two YYYY-MM-DD strings (a - b), via UTC midnight. */
function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00Z`).getTime();
  const db = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((da - db) / 86_400_000);
}

interface DaySquare {
  dateStr: string;
  ddmm: string;
  visited: boolean;
}

export default function PoolStreak() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [days, setDays] = useState<DaySquare[]>([]);
  const [daysSince, setDaysSince] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        setAuthed(false);
        setLoading(false);
        return;
      }
      setAuthed(true);

      const today = jerusalemToday();
      // Build the last 7 days (6 days ago → today) as YYYY-MM-DD.
      const base = new Date(`${today}T00:00:00Z`);
      const window: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(base);
        d.setUTCDate(d.getUTCDate() - i);
        window.push(d.toISOString().slice(0, 10));
      }

      const [weekRes, lastRes] = await Promise.all([
        supabase
          .from("pool_visits")
          .select("visit_date")
          .gte("visit_date", window[0]),
        supabase
          .from("pool_visits")
          .select("visit_date")
          .order("visit_date", { ascending: false })
          .limit(1),
      ]);

      if (cancelled) return;

      const visited = new Set((weekRes.data ?? []).map((r) => r.visit_date as string));
      setDays(
        window.map((dateStr) => ({
          dateStr,
          ddmm: toDDMM(dateStr),
          visited: visited.has(dateStr),
        }))
      );

      const last = lastRes.data?.[0]?.visit_date as string | undefined;
      setDaysSince(last ? daysBetween(today, last) : null);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // Hidden entirely for logged-out users and while we don't yet know.
  if (loading || !authed) return null;

  const overdue = daysSince !== null && daysSince > 5;

  return (
    <section className="space-y-3">
      {/* Days-since banner */}
      <div className="anim-rise rounded-3xl bg-white px-5 py-4 text-center ring-1 ring-[color:var(--color-pool-100)] shadow-sm">
        {daysSince === null ? (
          <p className="text-sm font-semibold text-[color:var(--color-ink-2)] sm:text-base">
            עדיין לא נכנסת לבריכה 🏊
          </p>
        ) : daysSince === 0 ? (
          <p className="text-sm font-semibold text-[color:var(--color-ink)] sm:text-base">
            היית בבריכה היום! 🎉
          </p>
        ) : (
          <p className="text-sm font-semibold text-[color:var(--color-ink-2)] sm:text-base">
            עברו{" "}
            <span
              className={`font-black ${
                overdue ? "text-red-600" : "text-[color:var(--color-pool-600)]"
              }`}
            >
              {daysSince}
            </span>{" "}
            ימים מאז הפעם האחרונה שנכנסת לבריכה
          </p>
        )}
      </div>

      {/* Last 7 days squares + DD/MM labels */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => (
          <div key={d.dateStr} className="flex flex-col items-center gap-1.5">
            <div
              className={`aspect-square w-full rounded-lg ${
                d.visited ? "bg-[color:var(--color-pool-500)]" : "bg-slate-200"
              }`}
              title={d.ddmm}
            />
            <span className="text-[10px] font-semibold text-[color:var(--color-ink-3)] sm:text-xs">
              {d.ddmm}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
