import { fetchUVForecast } from "@/lib/openmeteo";
import HeaderAuth from "@/components/HeaderAuth";
import { BANNER_SENTENCES } from "@/lib/banner";
import { LIFESTYLE_PHOTOS } from "@/lib/photos";
import BodyTheme from "@/components/BodyTheme";
import Reveal from "@/components/Reveal";
import RotatingBanner from "@/components/RotatingBanner";
import PoolStreak from "@/components/PoolStreak";
import PoolTimeHero from "@/components/PoolTimeHero";
import PoolPresence from "@/components/PoolPresence";
import ImageSlider from "@/components/ImageSlider";
import UVGauge from "@/components/UVGauge";
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

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 space-y-5 md:py-10 md:space-y-7">

        {/* Rotating daily banner */}
        <RotatingBanner sentence={banner} />

        {/* Personal "days since last pool visit" + last-7-days squares (logged-in only) */}
        <PoolStreak />

        {/* Screen-reader page title (city h2 is not the primary topic) */}
        <h1 className="sr-only">בריכה עכשיו — UV Tracker</h1>

        {/* Header: location + big auth button */}
        <header className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-2xl">📍</span>
              <h2 className="text-xl font-extrabold text-[color:var(--color-ink)] md:text-2xl">באר שבע</h2>
            </div>
            <p className="mt-0.5 mr-8 text-xs text-[color:var(--color-ink-2)] md:text-sm">{dateLabel}</p>
          </div>
          <HeaderAuth />
        </header>

        {/* Pool-time celebratory hero (UV >= 9 only) */}
        {poolTime && <PoolTimeHero uv={forecast.current} />}

        {/* UV index — the headline metric, highest on the page, above the pool */}
        <Reveal once variant="scale">
          <div className="radius-card shadow-pool-lg bg-white p-6 ring-1 ring-[color:var(--color-pool-100)] md:p-8">
            <UVGauge value={forecast.current} />
          </div>
        </Reveal>

        {/* Colorful daily UV graph — also above the pool */}
        <Reveal>
          <DailyChart hours={forecast.today.hours} />
        </Reveal>

        {/* Who's at the pool now — social centerpiece */}
        <Reveal>
          <PoolPresence currentUV={forecast.current} />
        </Reveal>

        {/* Weekly forecast — its own row, below the pool */}
        <Reveal>
          <WeeklyChart week={forecast.week} today={todayStr} />
        </Reveal>

        {/* Quick stats */}
        <Reveal>
          <UVStats today={forecast.today} />
        </Reveal>

        {/* Vibes gallery */}
        <Reveal>
          <section className="space-y-3">
            <h2 className="px-1 text-lg font-extrabold text-[color:var(--color-ink)] md:text-xl">
              וייבים מהבריכה ☀️
            </h2>
            <ImageSlider photos={LIFESTYLE_PHOTOS} aspect="16 / 9" />
          </section>
        </Reveal>

        {/* Bottom CTA — hidden for logged-in users */}
        <Reveal>
          <PoolBuddiesCTA />
        </Reveal>

        {/* Footer */}
        <footer className="pb-8 text-center text-xs text-[color:var(--color-ink-2)]">
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
