import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ChartBar, PersonSimpleSwim } from "@phosphor-icons/react/dist/ssr";
import HeaderAuth from "@/components/HeaderAuth";
import PoolStreak from "@/components/PoolStreak";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}ש׳ ${m}ד׳` : `${h} שעות`;
  }
  return `${minutes} דקות`;
}

export default async function StatsPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/register");

  const admin = getAdmin();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });

  // Compute boundaries from UTC midnight of today's Jerusalem date — same logic as PoolStreak
  // so "last 7 days" is exactly 7 calendar dates (today + 6 prior), never 8.
  const todayUtcMidnight = new Date(`${today}T00:00:00Z`);
  const sevenDaysAgoDate = new Date(todayUtcMidnight);
  sevenDaysAgoDate.setUTCDate(todayUtcMidnight.getUTCDate() - 6);
  const sevenDaysAgo = sevenDaysAgoDate.toISOString().slice(0, 10);

  const thirtyDaysAgoDate = new Date(todayUtcMidnight);
  thirtyDaysAgoDate.setUTCDate(todayUtcMidnight.getUTCDate() - 29);
  const thirtyDaysAgo = thirtyDaysAgoDate.toISOString().slice(0, 10);

  const [allVisits, profileData] = await Promise.all([
    admin.from("pool_visits").select("visit_date, duration_minutes").eq("user_id", user.id).order("visit_date", { ascending: false }),
    admin.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
  ]);

  const visits = allVisits.data ?? [];
  const last7 = visits.filter((v) => v.visit_date >= sevenDaysAgo);
  const last30 = visits.filter((v) => v.visit_date >= thirtyDaysAgo);

  const totalVisits = visits.length;
  const totalMinutes = visits.reduce((acc, v) => acc + (v.duration_minutes ?? 0), 0);
  const last7Count = last7.length;
  const last7Minutes = last7.reduce((acc, v) => acc + (v.duration_minutes ?? 0), 0);
  const last30Count = last30.length;
  const lastVisit = visits[0]?.visit_date ?? null;

  const profile = profileData.data;
  const displayName = profile?.display_name ?? user.user_metadata?.full_name ?? "שחיין";

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-md space-y-6 px-4 pb-16 pt-6">
        {/* Back link */}
        <Link
          href="/"
          className="flex w-fit items-center gap-1.5 text-sm font-semibold text-[color:var(--color-ink-2)] transition-colors hover:text-[color:var(--color-pool-600)]"
        >
          חזרה <ArrowRight size={18} aria-hidden />
        </Link>

        {/* Title + HeaderAuth dropdown */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-[color:var(--color-ink)]">
            <ChartBar size={26} weight="duotone" color="var(--color-pool-600)" aria-hidden />
            הסטטיסטיקה של {displayName.split(" ")[0]}
          </h1>
          <HeaderAuth />
        </div>

        {/* 7-day visual streak calendar */}
        <PoolStreak />

        {/* Summary + status */}
        <section className="surface-band space-y-3 p-4 sm:p-5">
          {/* Summary cards with staggered entrance */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: String(totalVisits), label: 'ביקורים סה"כ', size: "text-4xl", stagger: "0ms" },
              { value: String(last7Count), label: "ב-7 ימים אחרונים", size: "text-4xl", stagger: "60ms" },
              { value: totalMinutes > 0 ? formatDuration(totalMinutes) : "—", label: 'זמן בריכה סה"כ', size: "text-2xl", stagger: "120ms" },
              { value: last7Minutes > 0 ? formatDuration(last7Minutes) : "—", label: "זמן ב-7 ימים", size: "text-2xl", stagger: "180ms" },
            ].map(({ value, label, size, stagger }) => (
              <div
                key={label}
                className="anim-pop rounded-3xl bg-white p-5 ring-1 ring-[color:var(--color-pool-100)] shadow-pool-sm text-center"
                style={{ "--stagger": stagger } as React.CSSProperties}
              >
                <p className={`${size} font-black text-[color:var(--color-pool-600)]`}>{value}</p>
                <p className="mt-1 text-xs font-semibold text-[color:var(--color-ink-3)]">{label}</p>
              </div>
            ))}
          </div>

          {/* Status card — PoolStreak already shows days-since, so only show 30-day count + last date */}
          <div className="anim-rise rounded-3xl bg-white p-5 ring-1 ring-[color:var(--color-pool-100)] shadow-pool-sm space-y-3">
            <h2 className="text-sm font-extrabold text-[color:var(--color-ink)]">מצב נוכחי</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[color:var(--color-ink-2)]">ביקורים ב-30 יום</span>
                <span className="font-bold text-[color:var(--color-ink)]">{last30Count}</span>
              </div>
              {lastVisit && (
                <div className="flex justify-between">
                  <span className="text-[color:var(--color-ink-2)]">ביקור אחרון</span>
                  <span className="font-bold text-[color:var(--color-ink)]">{lastVisit.split("-").reverse().join("/")}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Visit history */}
        {visits.length > 0 && (
          <div className="rounded-3xl bg-white p-5 ring-1 ring-[color:var(--color-pool-100)] shadow-pool-sm space-y-3">
            <h2 className="text-sm font-extrabold text-[color:var(--color-ink)]">היסטוריית ביקורים</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {visits.slice(0, 30).map((v) => (
                <div key={v.visit_date} className="flex items-center justify-between rounded-xl bg-[color:var(--color-pool-50)] px-3 py-2">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-[color:var(--color-ink)]">
                    <PersonSimpleSwim size={16} weight="duotone" color="var(--color-pool-500)" aria-hidden />
                    {v.visit_date.split("-").reverse().join("/")}
                  </span>
                  {v.duration_minutes ? (
                    <span className="text-xs font-bold text-[color:var(--color-pool-600)]">
                      {formatDuration(v.duration_minutes)}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {visits.length === 0 && (
          <div className="rounded-3xl bg-white p-8 ring-1 ring-[color:var(--color-pool-100)] shadow-pool-sm text-center space-y-2">
            <PersonSimpleSwim size={44} weight="duotone" color="var(--color-pool-400)" className="mx-auto" aria-hidden />
            <p className="text-sm font-semibold text-[color:var(--color-ink-2)]">עוד אין ביקורים מתועדים</p>
            <p className="text-xs text-[color:var(--color-ink-3)]">לחץ &quot;אני בבריכה&quot; בדף הבית כדי להתחיל לעקוב</p>
          </div>
        )}

        <Link
          href="/"
          className="block w-full rounded-2xl py-4 text-center text-sm font-extrabold text-white"
          style={{ background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))" }}
        >
          חזרה לדף הבית
        </Link>
      </div>
    </main>
  );
}
