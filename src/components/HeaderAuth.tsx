"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

export default function HeaderAuth() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  if (user === undefined) {
    return <div className="h-12 w-28 animate-pulse rounded-2xl bg-[color:var(--color-pool-100)]" />;
  }

  if (user) {
    const meta = user.user_metadata ?? {};
    const avatar: string | null = meta.avatar_url ?? meta.picture ?? null;
    const name: string = meta.full_name ?? meta.name ?? "אני";
    const firstName = name.split(" ")[0];

    return (
      <div ref={wrapperRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
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
          <span className="text-[color:var(--color-ink-3)] text-xs" aria-hidden>▾</span>
        </button>

        {isOpen && (
          <div
            className="absolute left-0 top-full mt-2 z-50 min-w-[160px] rounded-2xl bg-white shadow-pool-lg ring-1 ring-[color:var(--color-pool-100)] overflow-hidden anim-pop"
            style={{ boxShadow: "0 8px 32px -4px rgba(14,147,212,0.18), 0 2px 8px -2px rgba(0,0,0,0.08)" }}
          >
            <Link
              href="/account"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 text-base font-semibold text-[color:var(--color-ink)] hover:bg-[color:var(--color-pool-50)] transition-colors"
            >
              <span>👤</span> הפרופיל שלי
            </Link>
            <div className="h-px bg-[color:var(--color-pool-100)]" />
            <Link
              href="/groups"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 text-base font-semibold text-[color:var(--color-ink)] hover:bg-[color:var(--color-pool-50)] transition-colors"
            >
              <span>🏊</span> הקבוצות שלי
            </Link>
            <div className="h-px bg-[color:var(--color-pool-100)]" />
            <Link
              href="/stats"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 text-base font-semibold text-[color:var(--color-ink)] hover:bg-[color:var(--color-pool-50)] transition-colors"
            >
              <span>📊</span> סטטיסטיקה
            </Link>
          </div>
        )}
      </div>
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
