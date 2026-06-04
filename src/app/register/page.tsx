"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react";
import Wordmark from "@/components/Wordmark";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.5l-6.6-5.6C29.6 34.5 26.9 35.5 24 35.5c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6C41.8 36.2 44 30.6 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}

export default function RegisterPage() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect already-authenticated users to home
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) router.replace("/");
    });
    return () => subscription.unsubscribe();
  }, [supabase, router]);

  async function signInWithGoogle() {
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError("ההתחברות ל-Google נכשלה. נסה שוב.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <Link
          href="/"
          className="flex w-fit items-center gap-1.5 text-sm font-semibold text-[color:var(--color-ink-2)] transition-colors hover:text-[color:var(--color-pool-600)]"
        >
          חזרה <ArrowRight size={18} aria-hidden />
        </Link>

        <div className="space-y-6 rounded-3xl bg-white p-8 shadow-pool-lg ring-1 ring-[color:var(--color-pool-100)]">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <Wordmark size="md" />
            </div>
            <h1 className="text-2xl font-black text-[color:var(--color-ink)]">התחברות מהירה</h1>
            <p className="mt-2 text-sm text-[color:var(--color-ink-2)]">
              חיבור עם Google ואתה בפנים: רואה מי בבריכה ומסמן את עצמך כשאתה במים
            </p>
          </div>

          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-4 text-base font-extrabold text-[color:var(--color-ink)] ring-1 ring-[color:var(--color-pool-200)] shadow-sm transition-all hover:bg-[color:var(--color-pool-50)] hover:shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            <GoogleIcon />
            {loading ? "מעביר ל-Google..." : "התחבר עם Google"}
          </button>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">
              {error}
            </p>
          )}

        </div>
      </div>
    </main>
  );
}
