import { createClient } from "@supabase/supabase-js";
import { fetchUVForecast } from "@/lib/openmeteo";
import HeaderAuth from "@/components/HeaderAuth";
import Wordmark from "@/components/Wordmark";
import { bannerForToday } from "@/lib/banner";
import { LIFESTYLE_PHOTOS } from "@/lib/photos";
import BodyTheme from "@/components/BodyTheme";
import Reveal from "@/components/Reveal";
import RotatingBanner from "@/components/RotatingBanner";
import PoolStreak from "@/components/PoolStreak";
import PoolVerdict from "@/components/PoolVerdict";
import PoolPresence from "@/components/PoolPresence";
import ImageSlider from "@/components/ImageSlider";
import UVStats from "@/components/UVStats";
import DailyChart from "@/components/DailyChart";
import WeeklyChart from "@/components/WeeklyChart";
import PoolBuddiesCTA from "@/components/PoolBuddiesCTA";
import PoolKingBanner from "@/components/PoolKingBanner";
import ShakeHananPopup from "@/components/ShakeHananPopup";
import MoreUVCountdownPopup from "@/components/MoreUVCountdownPopup";
import EquipmentSection from "@/components/EquipmentSection";
import CommentsSection from "@/components/CommentsSection";
import MoreUVButton from "@/components/MoreUVButton";

export const revalidate = 1800;

async function getPoolKing(): Promise<{ name: string; avatarUrl: string | null; totalHours: number } | null> {
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const since = sevenDaysAgo.toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });

    const { data } = await admin
      .from("pool_visits")
      .select("user_id, duration_minutes")
      .gte("visit_date", since)
      .not("duration_minutes", "is", null);

    if (!data?.length) return null;

    const totals = new Map<string, number>();
    for (const row of data as { user_id: string; duration_minutes: number }[]) {
      totals.set(row.user_id, (totals.get(row.user_id) ?? 0) + row.duration_minutes);
    }

    const [kingId, kingMinutes] = [...totals.entries()].reduce((a, b) => (b[1] > a[1] ? b : a));
    if (kingMinutes < 1) return null;

    const { data: profile } = await admin
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", kingId)
      .maybeSingle();

    return {
      name: (profile?.display_name as string | null) ?? "שחיין",
      avatarUrl: (profile?.avatar_url as string | null) ?? null,
      totalHours: kingMinutes / 60,
    };
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const forecast = await fetchUVForecast();
  const poolTime = forecast.current >= 9;
  const banner = bannerForToday();

  // Pool King — user with most total pool time in the last 7 days.
  const poolKing = await getPoolKing();

  // Night mode: after sunset or before sunrise in Israel.
  const nowMs = Date.now();
  const sunriseMs = forecast.sunrise ? new Date(forecast.sunrise).getTime() : null;
  const sunsetMs  = forecast.sunset  ? new Date(forecast.sunset).getTime()  : null;
  const nightMode = sunriseMs !== null && sunsetMs !== null
    ? nowMs < sunriseMs || nowMs > sunsetMs
    : false;

  const now = new Date();
  const dateLabel = now.toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Jerusalem",
  });
  // Israel-local date (YYYY-MM-DD), computed server-side so the weekly chart's
  // "today" highlight is identical on server and client (no hydration mismatch).
  const todayStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });

  return (
    <div className="relative min-h-screen">
      <BodyTheme poolTime={poolTime} nightMode={nightMode} />
      <ShakeHananPopup />
      <MoreUVCountdownPopup />

      {/* Decorative sun blob — centered to match the background gradient's 50% -10% radial */}
      <div
        className="anim-sun pointer-events-none fixed -top-10 left-1/2 -translate-x-1/2 z-0 h-40 w-40 rounded-full opacity-70"
        style={{ background: "radial-gradient(circle, var(--color-sun-300) 0%, rgba(255,217,94,0) 70%)" }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 md:py-10">
        <h1 className="sr-only">UV Pool — מדד UV ומי נמצא בבריכה בבאר שבע</h1>

        {/* Top bar: wordmark + date | More UV button + auth */}
        <header className="flex items-center justify-between gap-3">
          <div>
            <Wordmark size="md" city />
            <p className="mt-1.5 text-xs text-[color:var(--color-ink-2)] md:text-sm">{dateLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <MoreUVButton />
            <HeaderAuth />
          </div>
        </header>

        {/* Pool King banner */}
        {poolKing && (
          <div className="mt-4">
            <PoolKingBanner
              name={poolKing.name}
              avatarUrl={poolKing.avatarUrl}
              totalHours={poolKing.totalHours}
            />
          </div>
        )}

        {/* Daily one-liner */}
        <div className="mt-5">
          <RotatingBanner sentence={banner} />
        </div>

        {/* Personal streak (logged-in only) */}
        <div className="mt-4">
          <PoolStreak />
        </div>

        {/* THE hero: the day's verdict + the UV gauge as evidence */}
        <div className="mt-6 md:mt-8">
          <PoolVerdict uv={forecast.current} poolTime={poolTime} />
        </div>

        {/* The social payoff — promoted right under the verdict */}
        <Reveal className="mt-8 block md:mt-12">
          <PoolPresence currentUV={forecast.current} />
        </Reveal>

        {/* Equipment sharing */}
        <Reveal className="mt-6 block">
          <EquipmentSection />
        </Reveal>

        {/* The evidence zone — charts + stats grouped in one tinted band, not four
            free-floating identical white cards */}
        <Reveal className="mt-8 block md:mt-12">
          <section className="surface-band space-y-6 p-4 sm:p-6">
            <DailyChart hours={forecast.today.hours} />
            <UVStats today={forecast.today} />
            <WeeklyChart week={forecast.week} today={todayStr} />
          </section>
        </Reveal>

        {/* Vibes gallery */}
        <Reveal className="mt-8 block md:mt-12">
          <section className="space-y-3">
            <h2 className="px-1 text-lg font-extrabold text-[color:var(--color-ink)] md:text-xl">
              וייבים מהבריכה
            </h2>
            <ImageSlider photos={LIFESTYLE_PHOTOS} aspect="16 / 9" />
          </section>
        </Reveal>

        {/* Comments */}
        <Reveal className="mt-8 block md:mt-12">
          <CommentsSection />
        </Reveal>

        {/* Bottom CTA — hidden for logged-in users */}
        <Reveal className="mt-8 block md:mt-12">
          <PoolBuddiesCTA />
        </Reveal>

        {/* Footer */}
        <footer className="mt-10 pb-8 text-center text-xs text-[color:var(--color-ink-2)]">
          עודכן{" "}
          {now.toLocaleTimeString("he-IL", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Jerusalem",
          })}
          {" · "}
          <span className="opacity-70">מקור: Open-Meteo</span>
          {" · "}
          <a href="/more" className="font-bold text-[color:var(--color-pool-600)] hover:underline">More UV ✨</a>
        </footer>
      </div>
    </div>
  );
}
