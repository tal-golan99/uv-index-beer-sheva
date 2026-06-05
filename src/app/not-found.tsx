import Link from "next/link";
import Wordmark from "@/components/Wordmark";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Wordmark size="sm" className="mb-8" />

      <p className="display-title display-num" style={{ fontSize: "clamp(3.5rem, 18vw, 7rem)" }}>
        404
      </p>
      <h1 className="display-title mt-1 text-2xl text-[color:var(--color-ink)] sm:text-3xl">
        שחית רחוק מדי
      </h1>
      <p className="prose-pretty mt-4 max-w-sm text-base text-[color:var(--color-ink-2)]">
        הדף הזה לא קיים. כנראה צללת עמוק מדי. בוא נחזור למים הרדודים.
      </p>

      <Link
        href="/"
        className="cta-btn radius-nested shadow-pool-md mt-8 inline-block px-8 py-4 text-base font-extrabold text-white"
        style={{ background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))" }}
      >
        חזרה לדף הבית
      </Link>
    </main>
  );
}
