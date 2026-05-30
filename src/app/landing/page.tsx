import Link from "next/link";

function StarRating() {
  return (
    <span className="flex gap-0.5 text-yellow-400 text-lg leading-none" aria-label="5 כוכבים">
      {"★★★★★".split("").map((s, i) => <span key={i}>{s}</span>)}
    </span>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl bg-white/70 p-7 text-center ring-1 ring-white/80 backdrop-blur-sm shadow-lg">
      <span className="text-4xl">{icon}</span>
      <h3 className="text-base font-extrabold text-[color:var(--color-ink)]">{title}</h3>
      <p className="text-sm leading-relaxed text-[color:var(--color-ink-2)]">{desc}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-[color:var(--color-pool-100)]">
        <div className="flex items-center gap-2">
          <span className="text-2xl">☀️</span>
          <span className="text-lg font-black text-[color:var(--color-ink)]">UV Pool</span>
          <span className="text-xs font-bold text-white bg-[color:var(--color-pool-500)] px-2 py-0.5 rounded-full">באר שבע</span>
        </div>
        <Link
          href="/"
          className="rounded-2xl px-5 py-2.5 text-sm font-extrabold text-white transition-transform hover:scale-105 active:scale-95"
          style={{ background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))" }}
        >
          לקפוץ למים →
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-24 pb-28 text-center overflow-hidden">
        {/* Background blobs */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-80 w-80 rounded-full opacity-50" style={{ background: "radial-gradient(circle, #fde047 0%, rgba(253,224,71,0) 70%)" }} />
        <div className="pointer-events-none absolute -bottom-10 -left-16 h-64 w-64 rounded-full opacity-40" style={{ background: "radial-gradient(circle, #7dd3fc 0%, rgba(125,211,252,0) 70%)" }} />

        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[color:var(--color-pool-100)] px-4 py-2 text-sm font-bold text-[color:var(--color-pool-700)] ring-1 ring-[color:var(--color-pool-200)]">
          🆕 חדש לקיץ 2025
        </div>

        {/* Headline */}
        <h1 className="max-w-xl text-4xl font-black leading-tight text-[color:var(--color-ink)] sm:text-5xl md:text-6xl">
          האפליקציה{" "}
          <span className="shimmer-text">היחידה</span>
          {" "}שתצטרכו
          <br />
          לקיץ הקרוב
        </h1>

        <p className="mt-6 max-w-md text-lg text-[color:var(--color-ink-2)] leading-relaxed">
          מדד UV בזמן אמת · מי בבריכה עכשיו · התראות לפני שהשמש שורפת
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <Link
            href="/"
            className="rounded-2xl px-10 py-5 text-xl font-extrabold text-white transition-transform hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))",
              boxShadow: "0 16px 36px -10px rgba(2,132,199,0.75)",
            }}
          >
            🏊 לקפוץ למים
          </Link>
          <p className="text-sm text-[color:var(--color-ink-3)] font-semibold">בחינם לגמרי · ללא רישום</p>
        </div>

        {/* Floating sun */}
        <div className="anim-sun pointer-events-none mt-14 text-8xl select-none">☀️</div>
      </section>

      {/* ── Social proof strip ── */}
      <section className="mx-auto max-w-3xl px-4 py-6">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-white px-6 py-8 ring-1 ring-[color:var(--color-pool-100)] shadow-sm sm:flex-row sm:justify-around">
          <div className="flex flex-col items-center gap-1">
            <StarRating />
            <p className="text-2xl font-black text-[color:var(--color-ink)]">5.0</p>
            <p className="text-xs font-semibold text-[color:var(--color-ink-3)]">דירוג ממוצע</p>
          </div>
          <div className="hidden h-12 w-px bg-[color:var(--color-pool-100)] sm:block" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl">🏊</span>
            <p className="text-2xl font-black text-[color:var(--color-ink)]">1,000,000+</p>
            <p className="text-xs font-semibold text-[color:var(--color-ink-3)]">שחיינים מרוצים</p>
          </div>
          <div className="hidden h-12 w-px bg-[color:var(--color-pool-100)] sm:block" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl">🩺</span>
            <p className="text-lg font-black leading-tight text-[color:var(--color-ink)]">9 מתוך 10</p>
            <p className="text-xs font-semibold text-[color:var(--color-ink-3)]">רופאי עור ממליצים</p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="mb-8 text-center text-2xl font-black text-[color:var(--color-ink)]">
          למה כולם קופצים?
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <FeatureCard
            icon="🌞"
            title="UV בזמן אמת"
            desc="מדד UV מעודכן כל חצי שעה ישירות מ-Open-Meteo. תמיד תדעו לפני שתוצאו."
          />
          <FeatureCard
            icon="👀"
            title="מי בבריכה?"
            desc="ראו מי מחבריכם כבר בבריכה וסמנו את עצמכם בזמן אמת."
          />
          <FeatureCard
            icon="📲"
            title="התראות UV"
            desc="הבוט שלנו בטלגרם ישלח לכם הודעה שעה לפני השיא — כדי שלא תפספסו."
          />
        </div>
      </section>

      {/* ── Funny CTA ── */}
      <section className="mx-auto max-w-2xl px-4 py-10 text-center">
        <div
          className="rounded-3xl px-8 py-14 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #7dd3fc 100%)",
          }}
        >
          <div className="pointer-events-none absolute top-0 right-0 text-[180px] leading-none opacity-10 select-none">☀️</div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-3">
            מסר ישיר מהמייסדים
          </p>
          <h2 className="text-3xl font-black text-white sm:text-4xl leading-tight">
            אל תהיו לוזרים,
            <br />
            לכו להשתזף ☀️
          </h2>
          <p className="mt-4 text-base text-white/80">
            מומלץ על ידי 9 מתוך 10 רופאי עור שגם הולכים לבריכה
          </p>
          <Link
            href="/"
            className="mt-8 inline-block rounded-2xl bg-white px-8 py-4 text-base font-extrabold text-[color:var(--color-pool-700)] transition-transform hover:scale-105 active:scale-95 shadow-lg"
          >
            מוכן לקפוץ? →
          </Link>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="mx-auto max-w-3xl px-4 py-10">
        <h2 className="mb-6 text-center text-xl font-extrabold text-[color:var(--color-ink)]">
          מה אומרים השחיינים
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { name: "רונית מ.", avatar: "🏊‍♀️", text: "בגלל האפליקציה הזו יצאתי לבריכה 47 פעמים החודש. חיי השתנו.", stars: 5 },
            { name: "אמיר כ.", avatar: "🤽", text: "סוף סוף אפליקציה שמבינה את הצרכים שלי. UV 9 → אני כבר בחלוק רחצה.", stars: 5 },
            { name: "ד״ר שרה ל.", avatar: "🩺", text: "כרופאת עור, אני ממליצה. ואני גם ממש אוהבת בריכות.", stars: 5 },
            { name: "ניב ג.", avatar: "🌞", text: "הייתי חיוור כמו קיר. עכשיו אני ברונזה. תודה UV Pool.", stars: 5 },
          ].map((t) => (
            <div key={t.name} className="rounded-2xl bg-white p-5 ring-1 ring-[color:var(--color-pool-100)] shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{t.avatar}</span>
                <div>
                  <p className="text-sm font-extrabold text-[color:var(--color-ink)]">{t.name}</p>
                  <StarRating />
                </div>
              </div>
              <p className="text-sm text-[color:var(--color-ink-2)] leading-relaxed">&ldquo;{t.text}&rdquo;</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-4 py-20 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--color-ink-3)] mb-4">מחכים לכם</p>
        <h2 className="text-3xl font-black text-[color:var(--color-ink)] sm:text-4xl mb-8">
          הבריכה לא תחכה לכם
        </h2>
        <Link
          href="/"
          className="inline-block rounded-2xl px-12 py-5 text-xl font-extrabold text-white transition-transform hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))",
            boxShadow: "0 20px 40px -12px rgba(2,132,199,0.7)",
          }}
        >
          🏊 לקפוץ למים עכשיו
        </Link>
        <p className="mt-4 text-sm text-[color:var(--color-ink-3)]">חינם · ללא פרסומות · ללא שטויות</p>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[color:var(--color-pool-100)] px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-xl">☀️</span>
          <span className="font-black text-[color:var(--color-ink)]">UV Pool</span>
        </div>
        <p className="text-xs text-[color:var(--color-ink-3)]">
          נעשה באהבה עבור שחיינות ושחיינים של באר שבע · נתוני UV מ-Open-Meteo
        </p>
      </footer>

    </div>
  );
}
