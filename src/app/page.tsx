import Link from "next/link";
import { fetchUVForecast } from "@/lib/openmeteo";
import { BANNER_SENTENCES } from "@/lib/banner";
import { LIFESTYLE_PHOTOS } from "@/lib/photos";
import BodyTheme from "@/components/BodyTheme";
import Reveal from "@/components/Reveal";
import RotatingBanner from "@/components/RotatingBanner";
import PoolTimeHero from "@/components/PoolTimeHero";
import PoolPresence from "@/components/PoolPresence";
import ImageSlider from "@/components/ImageSlider";
import UVGauge from "@/components/UVGauge";
import UVStats from "@/components/UVStats";
import DailyChart from "@/components/DailyChart";
import WeeklyChart from "@/components/WeeklyChart";

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

  return (
    <div className="relative min-h-screen">
      <BodyTheme poolTime={poolTime} />

      {/* Decorative drifting sun */}
      <div
        className="anim-sun pointer-events-none fixed -top-10 -left-10 z-0 h-40 w-40 rounded-full opacity-70"
        style={{ background: "radial-gradient(circle, #fde047 0%, rgba(253,224,71,0) 70%)" }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 space-y-5 md:py-10 md:space-y-7">

        {/* Rotating daily banner */}
        <RotatingBanner sentence={banner} />

        {/* Header: location + big auth button */}
        <header className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-2xl">📍</span>
              <h1 className="text-xl font-extrabold text-[color:var(--color-ink)] md:text-2xl">באר שבע</h1>
            </div>
            <p className="mt-0.5 mr-8 text-xs text-[color:var(--color-ink-3)] md:text-sm">{dateLabel}</p>
          </div>
          <Link
            href="/register"
            className="rounded-2xl px-6 py-3.5 text-base font-extrabold text-white transition-transform hover:scale-105 active:scale-95 md:px-8 md:py-4 md:text-lg"
            style={{
              background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))",
              boxShadow: "0 12px 28px -10px rgba(2,132,199,0.8)",
            }}
          >
            התחבר / הרשם
          </Link>
        </header>

        {/* Pool-time celebratory hero (UV >= 9 only) */}
        {poolTime && <PoolTimeHero uv={forecast.current} />}

        {/* UV index — the headline metric, highest on the page, above the pool */}
        <Reveal once>
          <div
            className="rounded-3xl bg-white p-6 ring-1 ring-[color:var(--color-pool-100)] shadow-sm md:p-8"
            style={{ boxShadow: "0 24px 60px -28px rgba(14,165,233,0.55)" }}
          >
            <UVGauge value={forecast.current} />
          </div>
        </Reveal>

        {/* Colorful daily UV graph — also above the pool */}
        <Reveal>
          <DailyChart hours={forecast.today.hours} />
        </Reveal>

        {/* Who's at the pool now — social centerpiece */}
        <Reveal>
          <PoolPresence />
        </Reveal>

        {/* Weekly forecast — its own row, below the pool */}
        <Reveal>
          <WeeklyChart week={forecast.week} />
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

        {/* Bottom CTA */}
        <Reveal>
          <div
            className="flex flex-col items-center gap-3 rounded-3xl p-6 text-center md:p-8"
            style={{
              background: "linear-gradient(135deg, var(--color-pool-100), #fef9c3)",
              boxShadow: "0 16px 40px -20px rgba(14,165,233,0.6)",
            }}
          >
            <p className="text-lg font-black text-[color:var(--color-ink)] md:text-2xl">
              הצטרף ל-Pool Buddies שלך 🏊
            </p>
            <p className="text-sm text-[color:var(--color-ink-2)] md:text-base">
              תראה מי בבריכה, ותעדכן את החברים ברגע שאתה קופץ למים
            </p>
            <Link
              href="/register"
              className="mt-1 rounded-2xl px-8 py-4 text-base font-extrabold text-white transition-transform hover:scale-105 active:scale-95 md:text-lg"
              style={{
                background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))",
                boxShadow: "0 12px 28px -10px rgba(2,132,199,0.8)",
              }}
            >
              התחבר / הרשם עכשיו
            </Link>
          </div>
        </Reveal>

        {/* Footer */}
        <p className="pb-8 text-center text-xs text-[color:var(--color-ink-3)]">
          עודכן{" "}
          {now.toLocaleTimeString("he-IL", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Jerusalem",
          })}
          {" · "}
          <span className="opacity-70">מקור: Open-Meteo</span>
        </p>
      </div>
    </div>
  );
}
