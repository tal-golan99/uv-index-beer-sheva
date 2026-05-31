import { fetchUVForecast } from "@/lib/openmeteo";
import HeaderAuth from "@/components/HeaderAuth";
import Wordmark from "@/components/Wordmark";
import { BANNER_SENTENCES } from "@/lib/banner";
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

export const revalidate = 1800;

export default async function HomePage() {
  const forecast = await fetchUVForecast();
  const poolTime = forecast.current >= 9;
  // Pinned for now; rotation (bannerForToday) is ready once all 20 lines land.
  const banner = BANNER_SENTENCES[0];

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
      <BodyTheme poolTime={poolTime} />

      {/* Decorative sun blob — centered to match the background gradient's 50% -10% radial */}
      <div
        className="anim-sun pointer-events-none fixed -top-10 left-1/2 -translate-x-1/2 z-0 h-40 w-40 rounded-full opacity-70"
        style={{ background: "radial-gradient(circle, var(--color-sun-300) 0%, rgba(255,217,94,0) 70%)" }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 md:py-10">
        <h1 className="sr-only">UV Pool — מדד UV ומי נמצא בבריכה בבאר שבע</h1>

        {/* Top bar: wordmark + date | auth */}
        <header className="flex items-center justify-between gap-3">
          <div>
            <Wordmark size="md" city />
            <p className="mt-1.5 text-xs text-[color:var(--color-ink-2)] md:text-sm">{dateLabel}</p>
          </div>
          <HeaderAuth />
        </header>

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
        </footer>
      </div>
    </div>
  );
}
