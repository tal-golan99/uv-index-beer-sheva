import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sun,
  Eye,
  PaperPlaneTilt,
  PersonSimpleSwim,
  Stethoscope,
  Star,
} from "@phosphor-icons/react/dist/ssr";
import Reveal from "@/components/Reveal";
import Wordmark from "@/components/Wordmark";
import CommentsSection from "@/components/CommentsSection";

function StarRating() {
  return (
    <span className="flex gap-0.5 leading-none" aria-label="5 כוכבים">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} weight="fill" size={18} color="#f5b301" aria-hidden />
      ))}
    </span>
  );
}

/** A value prop as an asymmetric image + copy row. `flip` alternates the side so the
 *  three never read as identical twins. */
function FeatureRow({
  img,
  alt,
  icon,
  title,
  desc,
  flip,
}: {
  img: string;
  alt: string;
  icon: ReactNode;
  title: string;
  desc: string;
  flip?: boolean;
}) {
  return (
    <div className="grid items-center gap-6 md:grid-cols-2 md:gap-10">
      <div
        className={`radius-card shadow-pool-md relative aspect-[4/3] overflow-hidden ring-1 ring-[color:var(--color-pool-200)] ${
          flip ? "md:order-2" : ""
        }`}
      >
        <Image src={img} alt={alt} fill sizes="(min-width: 768px) 480px, 100vw" className="object-cover" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0369a1]/30 via-transparent to-transparent" />
      </div>

      <div className={flip ? "md:order-1" : ""}>
        <span
          className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[color:var(--color-pool-50)] ring-1 ring-[color:var(--color-pool-100)]"
          aria-hidden
        >
          {icon}
        </span>
        <h3 className="display-title text-2xl text-[color:var(--color-ink)] sm:text-3xl">{title}</h3>
        <p className="prose-pretty mt-3 max-w-md text-base leading-relaxed text-[color:var(--color-ink-2)]">
          {desc}
        </p>
      </div>
    </div>
  );
}

const REVIEWS = [
  { name: "רונית מ.", color: "#38bdf8", text: "בגלל האפליקציה הזו יצאתי לבריכה 47 פעמים החודש. חיי השתנו." },
  { name: "אמיר כ.", color: "#fb923c", text: "סוף סוף אפליקציה שמבינה אותי. UV נוגע ב-9, אני כבר בחלוק רחצה." },
  { name: "ד״ר שרה ל.", color: "#34d399", text: "כרופאת עור אני ממליצה בחום. ובמקרה גם מתה על בריכות." },
  { name: "ניב ג.", color: "#a78bfa", text: "הייתי חיוור כמו קיר. עכשיו אני ברונזה. תודה UV Pool." },
];

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
      <nav className="sticky top-0 z-50 flex items-center justify-between px-5 py-4 bg-white/80 backdrop-blur-md border-b border-[color:var(--color-pool-100)] sm:px-6">
        <Wordmark size="sm" city />
        <Link
          href="/register"
          aria-label="הרשמה ל-UV Pool"
          className="cta-btn radius-nested px-5 py-2.5 text-sm font-extrabold text-white"
          style={{ background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))" }}
        >
          להירשם בחינם
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center px-4 pt-20 pb-14 text-center sm:pt-28 md:pb-24">
        <Sun weight="fill" size={56} color="var(--color-sun-400)" className="anim-sun mb-6" aria-hidden />

        <h1 className="display-title max-w-3xl text-[color:var(--color-pool-700)]" style={{ fontSize: "clamp(2.75rem, 9vw, 5.5rem)" }}>
          האפליקציה היחידה
          <br />
          <span className="title-underline">שחשובה בקיץ</span>
        </h1>

        <p className="mt-7 max-w-md text-lg leading-relaxed text-balance text-[color:var(--color-ink-2)]">
          מדד UV חי לבאר שבע, מי בבריכה עכשיו, והתראה בטלגרם רגע לפני שהשמש מגיעה לשיא.
        </p>

        <Link
          href="/register"
          aria-label="הרשמה ל-UV Pool בחינם"
          className="cta-btn radius-nested shadow-pool-lg mt-10 inline-block px-10 py-5 text-xl font-extrabold text-white"
          style={{ background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))" }}
        >
          לקפוץ למים
        </Link>
        <p className="mt-4 text-sm text-[color:var(--color-ink-2)]">חינם · בלי פרסומות · בלי שטויות</p>
      </section>

      {/* ── Features: asymmetric image + copy rows, alternating sides ── */}
      <section className="mx-auto max-w-5xl space-y-16 px-4 py-12 md:space-y-24 md:py-20">
        <Reveal once>
          <FeatureRow
            img="/pool/life7.jpg"
            alt="יום שמשי על שפת הבריכה"
            icon={<Sun weight="duotone" size={28} color="var(--color-sun-500)" />}
            title="UV בזמן אמת"
            desc="מדד UV לבאר שבע, מתעדכן כל חצי שעה ישירות מ-Open-Meteo. אתה יודע מתי השמש שורפת עוד לפני שהיא שורפת."
          />
        </Reveal>
        <Reveal once>
          <FeatureRow
            img="/pool/pool.jpg"
            alt="בריכת אוניברסיטת בן-גוריון"
            icon={<Eye weight="duotone" size={28} color="var(--color-pool-600)" />}
            title="מי בבריכה עכשיו"
            desc="מפה חיה של מי מהחברים כבר במים. רואים שלושה בפנים, מצטרפים. ככה בריכה אמורה לעבוד."
            flip
          />
        </Reveal>
        {/* Third value prop as a full-width media banner — breaks the two-row zigzag rhythm */}
        <Reveal once>
          <div className="radius-card shadow-pool-md relative overflow-hidden ring-1 ring-[color:var(--color-pool-200)]">
            <div className="relative aspect-[16/10] sm:aspect-[21/9]">
              <Image
                src="/pool/life4.jpg"
                alt="שיזוף על שפת הבריכה"
                fill
                sizes="(min-width: 768px) 960px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a5784]/85 via-[#0a5784]/35 to-transparent" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-6 text-right sm:p-10">
              <span
                className="mb-3 inline-grid h-12 w-12 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm"
                aria-hidden
              >
                <PaperPlaneTilt weight="duotone" size={28} color="#ffffff" />
              </span>
              <h3 className="display-title text-2xl text-white sm:text-3xl">התראה לפני השיא</h3>
              <p className="prose-pretty mt-2 max-w-md text-base leading-relaxed text-white/85">
                הבוט בטלגרם שולח הודעה שעה לפני שה-UV נוגע ב-9. עד שאחרים מבינים שיצא שמש, אתה כבר עם המגבת ביד.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Deliberately absurd "stats" — the bit, with a disclaimer so it reads as one ── */}
      <section className="mx-auto max-w-4xl px-4 py-8">
        <Reveal once variant="scale">
          <div className="surface-band px-6 py-10 text-center sm:px-10">
            <h2 className="display-title text-2xl text-[color:var(--color-ink)] sm:text-3xl">
              המספרים מדברים בעד עצמם
            </h2>
            <div className="mt-8 grid gap-8 sm:grid-cols-3">
              <div className="flex flex-col items-center gap-1.5">
                <StarRating />
                <p className="text-3xl font-black text-[color:var(--color-ink)]">5.0</p>
                <p className="text-xs font-semibold text-[color:var(--color-ink-2)]">דירוג ממוצע</p>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <PersonSimpleSwim weight="duotone" size={34} color="var(--color-pool-600)" aria-hidden />
                <p className="text-3xl font-black text-[color:var(--color-ink)]">1,000,000+</p>
                <p className="text-xs font-semibold text-[color:var(--color-ink-2)]">שחיינים מרוצים</p>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Stethoscope weight="duotone" size={34} color="var(--color-pool-600)" aria-hidden />
                <p className="text-3xl font-black leading-tight text-[color:var(--color-ink)]">9 מתוך 10</p>
                <p className="text-xs font-semibold text-[color:var(--color-ink-2)]">רופאי עור ממליצים</p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Founders drench panel — the one fully committed color moment ── */}
      <section className="mx-auto max-w-2xl px-4 py-10 text-center">
        <Reveal once>
          <div
            className="radius-card relative overflow-hidden px-8 py-16"
            style={{
              background: "linear-gradient(135deg, var(--color-pool-700) 0%, var(--color-pool-500) 50%, var(--color-pool-300) 100%)",
            }}
          >
            <Sun
              weight="fill"
              size={220}
              color="#ffffff"
              className="pointer-events-none absolute -top-10 right-0 opacity-10"
              aria-hidden
            />
            <h2 className="display-title text-3xl text-white sm:text-4xl">
              אל תהיו לוזרים.
              <br />
              לכו להשתזף.
            </h2>
            <Link
              href="/register"
              aria-label="הרשמה ל-UV Pool"
              className="cta-btn radius-nested shadow-pool-lg mt-8 inline-block bg-white px-8 py-4 text-base font-extrabold text-[color:var(--color-pool-700)]"
            >
              בסדר, שכנעתם
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── Testimonials — deadpan, flagged as the bit ── */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <Reveal once>
          <h2 className="mb-7 text-center text-xl font-extrabold text-[color:var(--color-ink)]">
            ביקורות אמיתיות לחלוטין*
          </h2>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2">
          {REVIEWS.map((t, i) => (
            <Reveal key={t.name} once delay={i * 100}>
              <figure className="radius-nested shadow-pool-sm h-full bg-white p-5 ring-1 ring-[color:var(--color-pool-100)]">
                <figcaption className="mb-3 flex items-center gap-3">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-full text-sm font-black text-white"
                    style={{ background: t.color }}
                    aria-hidden
                  >
                    {t.name[0]}
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-[color:var(--color-ink)]">{t.name}</p>
                    <StarRating />
                  </div>
                </figcaption>
                <blockquote className="text-sm leading-relaxed text-[color:var(--color-ink-2)]">
                  &ldquo;{t.text}&rdquo;
                </blockquote>
              </figure>
            </Reveal>
          ))}
        </div>
        <p className="mt-5 text-center text-xs text-[color:var(--color-ink-2)]">
          * אף שחיין לא נפגע בזמן כתיבת הביקורות. גם לא נשאל.
        </p>
      </section>

      {/* ── Real user comments ── */}
      <section className="mx-auto max-w-3xl px-4 pb-4">
        <CommentsSection />
      </section>

      {/* ── Final CTA ── */}
      <section className="px-4 py-20 text-center">
        <Reveal once>
          <h2 className="display-title mb-8 text-3xl text-[color:var(--color-ink)] sm:text-5xl">
            הבריכה לא תחכה לך.
          </h2>
          <Link
            href="/register"
            aria-label="הרשמה ל-UV Pool בחינם"
            className="cta-btn radius-nested shadow-pool-lg inline-block px-12 py-5 text-xl font-extrabold text-white"
            style={{ background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))" }}
          >
            לקפוץ למים עכשיו
          </Link>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[color:var(--color-pool-100)] px-6 py-8 text-center">
        <div className="mb-2 flex justify-center">
          <Wordmark size="sm" />
        </div>
        <p className="text-xs text-[color:var(--color-ink-2)]">
          נעשה באהבה לשחייניות ולשחיינים של באר שבע · נתוני UV מ-Open-Meteo
        </p>
      </footer>

    </div>
  );
}
