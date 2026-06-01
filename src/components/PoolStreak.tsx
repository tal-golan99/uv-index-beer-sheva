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
  const [avgMinutes, setAvgMinutes] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let userId: string | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        setAuthed(false);
        setLoading(false);
        return;
      }
      setAuthed(true);

      // Set up realtime once, after we have the userId, with an explicit filter
      // so Supabase delivers INSERT events for this user's rows reliably.
      if (!userId) {
        userId = user.id;
        channel = supabase
          .channel("pool_visits_streak")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "pool_visits",
              filter: `user_id=eq.${userId}`,
            },
            () => { if (!cancelled) load(); }
          )
          .subscribe();
      }

      const today = jerusalemToday();
      const base = new Date(`${today}T00:00:00Z`);
      const dateWindow: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(base);
        d.setUTCDate(d.getUTCDate() - i);
        dateWindow.push(d.toISOString().slice(0, 10));
      }

      const [weekRes, lastRes, avgRes] = await Promise.all([
        supabase
          .from("pool_visits")
          .select("visit_date")
          .eq("user_id", userId)
          .gte("visit_date", dateWindow[0]),
        supabase
          .from("pool_visits")
          .select("visit_date")
          .eq("user_id", userId)
          .order("visit_date", { ascending: false })
          .limit(1),
        fetch("/api/stats/weekly").then((r) => r.json()).catch(() => ({ avg_minutes: null })),
      ]);

      if (cancelled) return;

      const visited = new Set((weekRes.data ?? []).map((r) => r.visit_date as string));
      setDays(
        dateWindow.map((dateStr) => ({
          dateStr,
          ddmm: toDDMM(dateStr),
          visited: visited.has(dateStr),
        }))
      );

      const last = lastRes.data?.[0]?.visit_date as string | undefined;
      setDaysSince(last ? daysBetween(today, last) : null);
      setAvgMinutes((avgRes as { avg_minutes: number | null }).avg_minutes ?? null);
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
      channel?.unsubscribe();
    };
  }, [supabase]);

  // Hidden entirely for logged-out users.
  if (!loading && !authed) return null;

  const overdue = daysSince !== null && daysSince > 5;
  const todayStr = loading ? "" : jerusalemToday();

  if (loading) {
    return (
      <section className="space-y-2">
        <div className="animate-pulse radius-card shadow-pool-sm bg-white px-5 py-4 ring-1 ring-[color:var(--color-pool-100)]">
          <div className="mx-auto h-4 w-48 rounded-full bg-slate-200" />
        </div>
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="animate-pulse h-7 w-7 rounded-md bg-slate-200" />
              <div className="h-2 w-5 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-2">
      {/* Days-since banner */}
      <div className="anim-rise radius-card shadow-pool-sm bg-white px-5 py-4 text-center ring-1 ring-[color:var(--color-pool-100)]">
        {daysSince === null ? (
          <p className="text-sm font-semibold text-[color:var(--color-ink-2)] sm:text-base">
            עוד לא קפצת למים. הכל עוד לפניך.
          </p>
        ) : daysSince === 0 ? (
          <p className="text-sm font-semibold text-[color:var(--color-ink)] sm:text-base">
            היית היום בבריכה. כל הכבוד.
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
      <div className="flex justify-center gap-1.5">
        {days.map((d) => {
          const isToday = d.dateStr === todayStr;
          return (
            <div key={d.dateStr} className="flex flex-col items-center gap-1">
              <div
                className={[
                  "h-8 w-8 rounded-full grid place-items-center",
                  d.visited
                    ? "bg-[color:var(--color-pool-500)]"
                    : "border-2 border-dashed border-slate-300 bg-transparent",
                  isToday ? "ring-2 ring-[color:var(--color-pool-400)] ring-offset-1" : "",
                ].join(" ")}
                title={d.ddmm}
              >
                {d.visited && (
                  <span className="text-sm leading-none select-none">🏊</span>
                )}
              </div>
              <span className="text-[9px] font-semibold text-[color:var(--color-ink-2)]">
                {d.ddmm}
              </span>
            </div>
          );
        })}
      </div>
      {/* Weekly average */}
      {avgMinutes !== null && (
        <p className="text-center text-xs font-semibold text-[color:var(--color-ink-3)]">
          ממוצע שבועי:{" "}
          <span className="text-[color:var(--color-pool-600)]">
            {avgMinutes >= 60
              ? `${Math.floor(avgMinutes / 60)}ש׳ ${avgMinutes % 60 > 0 ? `${avgMinutes % 60}ד׳` : ""}`
              : `${avgMinutes} דקות`}
          </span>
        </p>
      )}
    </section>
  );
}
