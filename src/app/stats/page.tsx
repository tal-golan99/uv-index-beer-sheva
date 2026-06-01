import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Wordmark from "@/components/Wordmark";

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
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });

  const [allVisits, recentVisits, profileData] = await Promise.all([
    admin.from("pool_visits").select("visit_date, duration_minutes").eq("user_id", user.id).order("visit_date", { ascending: false }),
    admin.from("pool_visits").select("visit_date, duration_minutes").eq("user_id", user.id).gte("visit_date", sevenDaysAgo),
    admin.from("profiles").select("display_name, avatar_url").eq("id", user.id).maybeSingle(),
  ]);

  const visits = allVisits.data ?? [];
  const last7 = recentVisits.data ?? [];
  const last30 = visits.filter((v) => v.visit_date >= thirtyDaysAgo);

  const totalVisits = visits.length;
  const totalMinutes = visits.reduce((acc, v) => acc + (v.duration_minutes ?? 0), 0);
  const last7Count = last7.length;
  const last7Minutes = last7.reduce((acc, v) => acc + (v.duration_minutes ?? 0), 0);
  const last30Count = last30.length;
  const lastVisit = visits[0]?.visit_date ?? null;

  const daysSinceLast = lastVisit
    ? Math.floor((new Date(today).getTime() - new Date(lastVisit).getTime()) / 86_400_000)
    : null;

  const profile = profileData.data;
  const displayName = profile?.display_name ?? user.user_metadata?.full_name ?? "שחיין";

  return (
    <main className="min-h-screen" dir="rtl">
      <div className="mx-auto max-w-md space-y-6 px-4 pb-16 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Wordmark />
          <Link href="/" className="flex items-center gap-1 text-sm font-semibold text-[color:var(--color-ink-2)] hover:text-[color:var(--color-ink)] transition-colors">
            חזרה <ArrowRight size={16} aria-hidden />
          </Link>
        </div>

        <h1 className="text-2xl font-extrabold text-[color:var(--color-ink)]">
          📊 הסטטיסטיקה של {displayName.split(" ")[0]}
        </h1>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-white p-5 ring-1 ring-[color:var(--color-pool-100)] shadow-pool-sm text-center">
            <p className="text-4xl font-black text-[color:var(--color-pool-600)]">{totalVisits}</p>
            <p className="mt-1 text-xs font-semibold text-[color:var(--color-ink-3)]">ביקורים סה&quot;כ</p>
          </div>
          <div className="rounded-3xl bg-white p-5 ring-1 ring-[color:var(--color-pool-100)] shadow-pool-sm text-center">
            <p className="text-4xl font-black text-[color:var(--color-pool-600)]">{last7Count}</p>
            <p className="mt-1 text-xs font-semibold text-[color:var(--color-ink-3)]">ב-7 ימים אחרונים</p>
          </div>
          <div className="rounded-3xl bg-white p-5 ring-1 ring-[color:var(--color-pool-100)] shadow-pool-sm text-center">
            <p className="text-2xl font-black text-[color:var(--color-pool-600)]">
              {totalMinutes > 0 ? formatDuration(totalMinutes) : "—"}
            </p>
            <p className="mt-1 text-xs font-semibold text-[color:var(--color-ink-3)]">זמן בריכה סה&quot;כ</p>
          </div>
          <div className="rounded-3xl bg-white p-5 ring-1 ring-[color:var(--color-pool-100)] shadow-pool-sm text-center">
            <p className="text-2xl font-black text-[color:var(--color-pool-600)]">
              {last7Minutes > 0 ? formatDuration(last7Minutes) : "—"}
            </p>
            <p className="mt-1 text-xs font-semibold text-[color:var(--color-ink-3)]">זמן ב-7 ימים</p>
          </div>
        </div>

        {/* Status card */}
        <div className="rounded-3xl bg-white p-5 ring-1 ring-[color:var(--color-pool-100)] shadow-pool-sm space-y-3">
          <h2 className="text-sm font-extrabold text-[color:var(--color-ink)]">מצב נוכחי</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[color:var(--color-ink-2)]">ביקורים ב-30 יום</span>
              <span className="font-bold text-[color:var(--color-ink)]">{last30Count}</span>
            </div>
            {daysSinceLast !== null && (
              <div className="flex justify-between">
                <span className="text-[color:var(--color-ink-2)]">ימים מאז הפעם האחרונה</span>
                <span className={`font-bold ${daysSinceLast > 5 ? "text-red-600" : "text-[color:var(--color-pool-600)]"}`}>
                  {daysSinceLast === 0 ? "היום!" : `${daysSinceLast} ימים`}
                </span>
              </div>
            )}
            {lastVisit && (
              <div className="flex justify-between">
                <span className="text-[color:var(--color-ink-2)]">ביקור אחרון</span>
                <span className="font-bold text-[color:var(--color-ink)]">{lastVisit.split("-").reverse().join("/")}</span>
              </div>
            )}
          </div>
        </div>

        {/* Visit history */}
        {visits.length > 0 && (
          <div className="rounded-3xl bg-white p-5 ring-1 ring-[color:var(--color-pool-100)] shadow-pool-sm space-y-3">
            <h2 className="text-sm font-extrabold text-[color:var(--color-ink)]">היסטוריית ביקורים</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {visits.slice(0, 30).map((v) => (
                <div key={v.visit_date} className="flex items-center justify-between rounded-xl bg-[color:var(--color-pool-50)] px-3 py-2">
                  <span className="text-sm font-semibold text-[color:var(--color-ink)]">
                    🏊 {v.visit_date.split("-").reverse().join("/")}
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
            <p className="text-4xl">🏊</p>
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
