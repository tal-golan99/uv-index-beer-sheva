"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

export default function HeaderAuth() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  // Loading — render same size as the button to avoid layout shift
  if (user === undefined) {
    return <div className="h-12 w-28 animate-pulse rounded-2xl bg-[color:var(--color-pool-100)]" />;
  }

  if (user) {
    const meta = user.user_metadata ?? {};
    const avatar: string | null = meta.avatar_url ?? meta.picture ?? null;
    const name: string = meta.full_name ?? meta.name ?? "אני";
    const firstName = name.split(" ")[0];

    return (
      <Link
        href="/account"
        className="pressable radius-nested shadow-pool-sm flex items-center gap-2.5 bg-white px-3 py-2 text-sm font-bold text-[color:var(--color-ink)] ring-1 ring-[color:var(--color-pool-200)] transition-colors hover:bg-[color:var(--color-pool-50)]"
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt={name} className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <div className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--color-pool-200)] text-sm">
            {firstName[0]}
          </div>
        )}
        <span className="max-w-[96px] truncate">{firstName}</span>
      </Link>
    );
  }

  return (
    <Link
      href="/register"
      className="cta-btn radius-nested shadow-pool-md px-6 py-3.5 text-base font-extrabold text-white md:px-8 md:py-4 md:text-lg"
      style={{
        background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))",
      }}
    >
      התחבר / הרשם
    </Link>
  );
}
