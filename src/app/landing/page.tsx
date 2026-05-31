import Link from "next/link";
import Reveal from "@/components/Reveal";

function StarRating() {
  return (
    <span className="flex gap-0.5 text-yellow-400 text-lg leading-none" aria-label="5 כוכבים">
      {"★★★★★".split("").map((s, i) => <span key={i}>{s}</span>)}
    </span>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="radius-card shadow-pool-md flex h-full flex-col items-center gap-3 bg-white p-7 text-center ring-1 ring-[color:var(--color-pool-100)] transition-transform duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-1">
      <span className="text-4xl" aria-hidden="true">{icon}</span>
      <h3 className="text-base font-extrabold text-[color:var(--color-ink)]">{title}</h3>
      <p className="prose-pretty text-sm leading-relaxed text-[color:var(--color-ink-2)]">{desc}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">

      {/* ── Animated aurora background — vivid summer light drifting behind everything ── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="anim-blob absolute -top-32 -right-24 h-[32rem] w-[32rem] rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-sun-300) 0%, rgba(255,217,94,0) 70%)" }}
        />
        <div
          className="anim-blob absolute top-1/4 -left-32 h-[34rem] w-[34rem] rounded-full opacity-45 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-pool-300) 0%, rgba(127,196,239,0) 70%)", animationDelay: "-8s" }}
        />
        <div
          className="anim-blob absolute bottom-0 right-1/4 h-[28rem] w-[28rem] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-pool-400) 0%, rgba(63,169,227,0) 70%)", animationDelay: "-15s" }}
        />
      </div>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-[color:var(--color-pool-100)]">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">☀️</span>
          <span className="text-lg font-black text-[color:var(--color-ink)]">UV Pool</span>
          <span className="text-xs font-bold text-white bg-[color:var(--color-pool-500)] px-2 py-0.5 rounded-full">באר שבע</span>
        </div>
        <Link
          href="/register"
          aria-label="הירשמו ל-UV Pool"
          className="cta-btn radius-nested px-5 py-2.5 text-sm font-extrabold text-white"
          style={{ background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))" }}
        >
          לקפוץ למים →
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-24 pb-12 md:pb-20 text-center overflow-hidden">
        {/* Headline */}
        <h1 className="display-title max-w-2xl text-5xl font-black text-[color:var(--color-pool-700)] sm:text-6xl md:text-7xl">
          האפליקציה היחידה שתצטרכו
          <br />
          <span className="title-underline">לקיץ הקרוב</span>
        </h1>

        <p className="mt-6 max-w-md text-lg text-[color:var(--color-ink-2)] leading-relaxed text-balance">
          מדד UV בזמן אמת · מי בבריכה עכשיו · התראות לפני שהשמש שורפת
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <Link
            href="/register"
            aria-label="הירשמו ל-UV Pool בחינם"
            className="cta-btn radius-nested shadow-pool-lg px-10 py-5 text-xl font-extrabold text-white"
            style={{
              background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))",
            }}
          >
            🏊 לקפוץ למים
          </Link>
        </div>

        {/* Floating sun */}
        <div className="anim-sun pointer-events-none mt-14 text-8xl select-none" aria-hidden="true">☀️</div>
      </section>

      {/* ── Social proof strip ── */}
      <section className="mx-auto max-w-3xl px-4 py-6">
        <Reveal once variant="scale">
          <div className="radius-card shadow-pool-md flex flex-col items-center gap-6 bg-white px-6 py-8 ring-1 ring-[color:var(--color-pool-100)] sm:flex-row sm:justify-around">
            <div className="flex flex-col items-center gap-1">
              <StarRating />
              <p className="text-2xl font-black text-[color:var(--color-ink)]">5.0</p>
              <p className="text-xs font-semibold text-[color:var(--color-ink-2)]">דירוג ממוצע</p>
            </div>
            <div className="hidden h-12 w-px bg-[color:var(--color-pool-100)] sm:block" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl" aria-hidden="true">🏊</span>
              <p className="text-2xl font-black text-[color:var(--color-ink)]">1,000,000+</p>
              <p className="text-xs font-semibold text-[color:var(--color-ink-2)]">שחיינים מרוצים</p>
            </div>
            <div className="hidden h-12 w-px bg-[color:var(--color-pool-100)] sm:block" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl" aria-hidden="true">🩺</span>
              <p className="text-lg font-black leading-tight text-[color:var(--color-ink)]">9 מתוך 10</p>
              <p className="text-xs font-semibold text-[color:var(--color-ink-2)]">רופאי עור ממליצים</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-3xl px-4 py-12 bg-[color:var(--color-pool-50)]/50 rounded-3xl">
        <Reveal once>
          <h2 className="mb-8 text-center text-2xl font-black text-[color:var(--color-ink)]">
            למה כולם קופצים?
          </h2>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-3">
          <Reveal once delay={0}>
            <FeatureCard
              icon="🌞"
              title="UV בזמן אמת"
              desc="מדד UV מעודכן כל חצי שעה ישירות מ-Open-Meteo. תמיד תדעו לפני שתוצאו."
            />
          </Reveal>
          <Reveal once delay={100}>
            <FeatureCard
              icon="👀"
              title="מי בבריכה?"
              desc="ראו מי מחבריכם כבר בבריכה וסמנו את עצמכם בזמן אמת."
            />
          </Reveal>
          <Reveal once delay={200}>
            <FeatureCard
              icon="📲"
              title="התראות UV"
              desc="הבוט שלנו בטלגרם ישלח לכם הודעה שעה לפני השיא — כדי שלא תפספסו."
            />
          </Reveal>
        </div>
      </section>

      {/* ── Funny CTA ── */}
      <section className="mx-auto max-w-2xl px-4 py-10 text-center">
        <Reveal once>
          <div
            className="radius-card px-8 py-14 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, var(--color-pool-700) 0%, var(--color-pool-500) 50%, var(--color-pool-300) 100%)",
            }}
          >
            <div className="pointer-events-none absolute top-0 right-0 text-[180px] leading-none opacity-10 select-none" aria-hidden="true">☀️</div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/75 mb-3">
              מסר ישיר מהמייסדים
            </p>
            <h2 className="display-title text-3xl font-black text-white sm:text-4xl">
              אל תהיו לוזרים,
              <br />
              לכו להשתזף <span aria-hidden="true">☀️</span>
            </h2>
            <p className="mt-4 text-base text-white/85">
              מומלץ על ידי 9 מתוך 10 רופאי עור שגם הולכים לבריכה
            </p>
            <Link
              href="/register"
              aria-label="הירשמו ל-UV Pool"
              className="cta-btn radius-nested shadow-pool-lg mt-8 inline-block bg-white px-8 py-4 text-base font-extrabold text-[color:var(--color-pool-700)]"
            >
              מוכן לקפוץ? →
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── Testimonials ── */}
      <section className="mx-auto max-w-3xl px-4 py-10 bg-[color:var(--color-pool-50)]/50 rounded-3xl">
        <Reveal once>
          <h2 className="mb-6 text-center text-xl font-extrabold text-[color:var(--color-ink)]">
            מה אומרים השחיינים
          </h2>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { name: "רונית מ.", avatar: "🏊‍♀️", text: "בגלל האפליקציה הזו יצאתי לבריכה 47 פעמים החודש. חיי השתנו.", stars: 5 },
            { name: "אמיר כ.", avatar: "🤽", text: "סוף סוף אפליקציה שמבינה את הצרכים שלי. UV 9 → אני כבר בחלוק רחצה.", stars: 5 },
            { name: "ד״ר שרה ל.", avatar: "🩺", text: "כרופאת עור, אני ממליצה. ואני גם ממש אוהבת בריכות.", stars: 5 },
            { name: "ניב ג.", avatar: "🌞", text: "הייתי חיוור כמו קיר. עכשיו אני ברונזה. תודה UV Pool.", stars: 5 },
          ].map((t, i) => (
            <Reveal key={t.name} once delay={i * 120}>
              <div className="radius-nested shadow-pool-sm bg-white p-5 ring-1 ring-[color:var(--color-pool-100)] h-full">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl anim-bob" aria-hidden="true">{t.avatar}</span>
                  <div>
                    <p className="text-sm font-extrabold text-[color:var(--color-ink)]">{t.name}</p>
                    <StarRating />
                  </div>
                </div>
                <p className="text-sm text-[color:var(--color-ink-2)] leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-4 py-20 text-center">
        <Reveal once>
          <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--color-ink-2)] mb-4">מחכים לכם</p>
          <h2 className="display-title text-3xl font-black text-[color:var(--color-ink)] sm:text-4xl mb-8">
            הבריכה לא תחכה לכם
          </h2>
          <Link
            href="/register"
            aria-label="הירשמו ל-UV Pool בחינם"
            className="cta-btn radius-nested shadow-pool-lg inline-block px-12 py-5 text-xl font-extrabold text-white"
            style={{
              background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))",
            }}
          >
            🏊 לקפוץ למים עכשיו
          </Link>
          <p className="mt-4 text-sm text-[color:var(--color-ink-2)]">חינם · ללא פרסומות · ללא שטויות</p>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[color:var(--color-pool-100)] px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-xl" aria-hidden="true">☀️</span>
          <span className="font-black text-[color:var(--color-ink)]">UV Pool</span>
        </div>
        <p className="text-xs text-[color:var(--color-ink-2)]">
          נעשה באהבה עבור שחיינות ושחיינים של באר שבע · נתוני UV מ-Open-Meteo
        </p>
      </footer>

    </div>
  );
}
