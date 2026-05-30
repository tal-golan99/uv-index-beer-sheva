"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function PoolBuddiesCTA() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  if (loggedIn !== false) return null;

  return (
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
  );
}
