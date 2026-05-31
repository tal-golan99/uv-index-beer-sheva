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
      className="radius-card shadow-pool-lg flex flex-col items-center gap-3 p-6 text-center md:p-8"
      style={{
        background: "linear-gradient(135deg, var(--color-pool-100), var(--color-sun-300))",
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
        className="cta-btn radius-nested shadow-pool-md mt-1 px-8 py-4 text-base font-extrabold text-white md:text-lg"
        style={{
          background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))",
        }}
      >
        התחבר / הרשם עכשיו
      </Link>
    </div>
  );
}
