import Link from "next/link";
import Image from "next/image";
import { Sun, Lock, ChartBar, UsersThree, Star, Lightning, Crown, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import Wordmark from "@/components/Wordmark";

const TIERS = [
  {
    name: "Free",
    price: "₪0",
    period: "לתמיד",
    emoji: "🏊",
    color: "#3fa9e3",
    features: ["UV בזמן אמת", "מי בבריכה עכשיו", "התראות טלגרם בסיסיות", "7 ימי היסטוריה"],
    cta: "הפלאן הנוכחי שלך",
    ctaDisabled: true,
  },
  {
    name: "Bronze UV",
    price: "₪9",
    period: "לחודש",
    emoji: "🥉",
    color: "#cd7f32",
    features: ["הכל בחינמי", "30 יום היסטוריה", "ממוצע זמן שבועי מפורט", "עיצוב לילה מתקדם"],
    cta: "בקרוב",
    ctaDisabled: true,
    soon: true,
  },
  {
    name: "Gold UV",
    price: "₪19",
    period: "לחודש",
    emoji: "🥇",
    color: "#f7bd24",
    features: ["הכל ב-Bronze", "כתר מיוחד על האווטאר", "סטטיסטיקות קבוצה", "עדיפות בהתראות"],
    cta: "בקרוב",
    ctaDisabled: true,
    soon: true,
  },
  {
    name: "Diamond UV",
    price: "₪49",
    period: "לחודש",
    emoji: "💎",
    color: "#a855f7",
    features: ["הכל ב-Gold", "אנליטיקס מלאות", "עיצוב אווטאר מותאם אישית", "שנה אחת ללא פרסומות", "תג Diamond בפרופיל"],
    cta: "בקרוב",
    ctaDisabled: true,
    soon: true,
  },
];

const COMING_FEATURES = [
  { icon: <ChartBar weight="duotone" size={22} />, label: "סטטיסטיקות היסטוריה מלאות" },
  { icon: <UsersThree weight="duotone" size={22} />, label: "אנליטיקס קבוצות בריכה" },
  { icon: <Crown weight="duotone" size={22} />, label: "מסגרת אווטאר בכתר" },
  { icon: <Lightning weight="duotone" size={22} />, label: "התראות UV בעדיפות גבוהה" },
  { icon: <ShieldCheck weight="duotone" size={22} />, label: "גישה לפיצ'רים בטא ראשון" },
  { icon: <Star weight="duotone" size={22} />, label: "תג מוזהב בפרופיל" },
];

export default function MorePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Animated background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="anim-blob absolute -top-20 left-1/2 -translate-x-1/2 h-[36rem] w-[36rem] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-sun-300) 0%, rgba(255,217,94,0) 70%)" }}
        />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-5 py-4 bg-white/80 backdrop-blur-md border-b border-[color:var(--color-pool-100)]">
        <Link href="/" className="flex items-center gap-2">
          <Wordmark size="sm" />
        </Link>
        <Link href="/" className="text-sm font-semibold text-[color:var(--color-ink-2)] hover:text-[color:var(--color-pool-600)] transition-colors">
          ← חזרה
        </Link>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-12 md:py-20 space-y-16">
        {/* Hero */}
        <section className="text-center space-y-6">
          {/* Hero image */}
          <div className="relative mx-auto w-full max-w-sm aspect-[4/3] rounded-3xl overflow-hidden shadow-pool-lg ring-1 ring-[color:var(--color-pool-200)]">
            <Image
              src="/pool/life4.jpg"
              alt="שיזוף בבריכה"
              fill
              className="object-cover"
              sizes="480px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a5784]/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <span className="text-4xl font-black text-white" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
                More UV ✨
              </span>
            </div>
          </div>

          <Sun weight="fill" size={44} color="var(--color-sun-400)" className="anim-sun mx-auto" aria-hidden />
          <h1 className="display-title text-[color:var(--color-pool-700)]" style={{ fontSize: "clamp(2.2rem, 7vw, 4rem)" }}>
            המנוי שהשמש<br />לא יכולה להתאפק עליו
          </h1>
          <p className="text-base text-[color:var(--color-ink-2)] max-w-md mx-auto">
            יותר פיצ׳רים, יותר שיזוף, יותר הכל.
          </p>
          {/* Coming soon ribbon */}
          <div
            className="mx-auto inline-block rounded-full px-6 py-2 text-sm font-extrabold text-white"
            style={{ background: "linear-gradient(90deg, var(--color-pool-600), #a855f7)" }}
          >
            ☀️ Coming Soon — נפתח בקרוב
          </div>
        </section>

        {/* Pricing tiers */}
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className="radius-card shadow-pool-md bg-white p-6 flex flex-col gap-4 ring-1 ring-[color:var(--color-pool-100)] relative overflow-hidden"
            >
              {tier.soon && (
                <div
                  className="absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white"
                  style={{ background: "linear-gradient(90deg, #f59e0b, #ef4444)" }}
                >
                  בקרוב
                </div>
              )}
              <div className="text-center">
                <span className="text-4xl">{tier.emoji}</span>
                <h2 className="mt-2 text-lg font-extrabold text-[color:var(--color-ink)]">{tier.name}</h2>
                <div className="mt-1">
                  <span className="text-3xl font-black" style={{ color: tier.color }}>{tier.price}</span>
                  <span className="text-xs text-[color:var(--color-ink-3)]"> / {tier.period}</span>
                </div>
              </div>

              <ul className="space-y-1.5 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-[color:var(--color-ink-2)]">
                    {tier.soon ? (
                      <Lock size={12} color={tier.color} weight="bold" aria-hidden />
                    ) : (
                      <span className="text-green-500 text-xs">✓</span>
                    )}
                    {f}
                  </li>
                ))}
              </ul>

              <button
                disabled={tier.ctaDisabled}
                className="w-full rounded-2xl py-3 text-sm font-extrabold text-white disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: `linear-gradient(90deg, ${tier.color}, ${tier.color}99)` }}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </section>

        {/* Coming features */}
        <section className="surface-band px-6 py-10 text-center space-y-6">
          <h2 className="display-title text-2xl text-[color:var(--color-ink)]">מה יגיע בקרוב</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 max-w-xl mx-auto">
            {COMING_FEATURES.map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-2 rounded-2xl bg-white px-4 py-4 ring-1 ring-[color:var(--color-pool-100)]">
                <span className="text-[color:var(--color-pool-600)]">{f.icon}</span>
                <span className="text-xs font-semibold text-[color:var(--color-ink-2)] text-center">{f.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Waitlist CTA */}
        <section className="text-center space-y-4">
          <h2 className="display-title text-2xl text-[color:var(--color-ink)]">רוצה להיות ראשון לדעת?</h2>
          <p className="text-sm text-[color:var(--color-ink-2)]">הירשם לרשימת ההמתנה ונעדכן אותך כשהמנוי עולה.</p>
          <button
            disabled
            className="rounded-2xl px-10 py-4 text-base font-extrabold text-white opacity-70 cursor-not-allowed"
            style={{ background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))" }}
          >
            הצטרפות לרשימת ההמתנה — בקרוב
          </button>
        </section>
      </main>
    </div>
  );
}
