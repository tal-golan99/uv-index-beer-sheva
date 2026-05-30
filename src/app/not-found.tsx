import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="space-y-5">
        <div className="text-6xl">🏊</div>
        <h1 className="text-3xl font-black text-[color:var(--color-ink)]">הדף לא נמצא</h1>
        <p className="text-base text-[color:var(--color-ink-2)]">
          הדף שחיפשת לא קיים. אולי טעית בכתובת?
        </p>
        <Link
          href="/"
          className="inline-block rounded-2xl px-8 py-4 text-base font-extrabold text-white transition-transform hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))",
            boxShadow: "0 12px 28px -10px rgba(2,132,199,0.8)",
          }}
        >
          → חזרה לדף הבית
        </Link>
      </div>
    </main>
  );
}
