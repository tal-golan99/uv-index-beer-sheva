"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

const PRESET_ITEMS = ["🍺 בירות", "🧊 קרח", "🍉 אבטיח", "🎒 תרמיל", "🧴 שמן הגנה", "🔊 רמקול", "🥏 פריסבי"];

interface Response {
  id: string;
  user_id: string;
  item: string;
  profiles: { display_name: string | null } | null;
}

interface Query {
  id: string;
  user_id: string;
  message: string | null;
  created_at: string;
  pool_equipment_responses: Response[];
}

export default function EquipmentSection() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [authed, setAuthed] = useState(false);
  const [queries, setQueries] = useState<Query[]>([]);
  const [posting, setPosting] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setAuthed(true);
    });
    loadQueries();
  }, [supabase]);

  async function loadQueries() {
    const res = await fetch("/api/equipment");
    if (res.ok) setQueries(await res.json());
  }

  async function announce(item: string) {
    if (!authed) return;
    setPosting(item);
    await fetch("/api/equipment/bring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item }),
    });
    setPosting(null);
    await loadQueries();
  }

  async function askQuestion() {
    if (!authed) return;
    setPosting("ask");
    await fetch("/api/equipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: null }),
    });
    setPosting(null);
    await loadQueries();
  }

  async function respond(queryId: string, item: string) {
    await fetch("/api/equipment/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query_id: queryId, item }),
    });
    await loadQueries();
  }

  // Separate the general daily query (message = null) from explicit question queries
  const generalQuery = queries.find((q) => q.message === null);
  const questionQueries = queries.filter((q) => q.message !== null);

  return (
    <section className="radius-card shadow-pool-sm bg-white ring-1 ring-[color:var(--color-pool-100)] overflow-hidden">
      <button
        className="flex w-full items-center justify-between px-5 py-4 text-right"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="text-sm font-extrabold text-[color:var(--color-ink)]">🎒 מי מביא מה?</span>
        <span className="text-[color:var(--color-ink-3)] text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-[color:var(--color-pool-100)] px-5 pb-5 pt-4 space-y-4">

          {/* "אני מביא" — tap a chip to announce */}
          {authed && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-[color:var(--color-ink-2)]">אני מביא →</p>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_ITEMS.map((item) => (
                  <button
                    key={item}
                    onClick={() => announce(item)}
                    disabled={posting !== null}
                    className="rounded-full bg-[color:var(--color-pool-50)] px-3 py-1.5 text-xs font-semibold text-[color:var(--color-pool-700)] ring-1 ring-[color:var(--color-pool-200)] hover:bg-[color:var(--color-pool-100)] transition-all disabled:opacity-50"
                  >
                    {posting === item ? "..." : item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Shared "brings" list */}
          {generalQuery && generalQuery.pool_equipment_responses.length > 0 && (
            <div className="rounded-2xl bg-[color:var(--color-pool-50)] p-3 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {generalQuery.pool_equipment_responses.map((r) => (
                  <span
                    key={r.id}
                    className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[color:var(--color-pool-700)] ring-1 ring-[color:var(--color-pool-200)]"
                  >
                    {r.profiles?.display_name ?? "מישהו"} מביא {r.item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* "שאל מי מביא" button + question cards */}
          {authed && (
            <button
              onClick={askQuestion}
              disabled={posting !== null}
              className="w-full rounded-2xl py-2.5 text-sm font-extrabold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))" }}
            >
              {posting === "ask" ? "שולח..." : "שאל מי מביא ציוד"}
            </button>
          )}

          {questionQueries.length > 0 && (
            <div className="space-y-3">
              {questionQueries.map((q) => (
                <div key={q.id} className="rounded-2xl bg-[color:var(--color-pool-50)] p-3 space-y-2">
                  {q.message && (
                    <p className="text-sm font-semibold text-[color:var(--color-ink)]">{q.message}</p>
                  )}
                  {q.pool_equipment_responses.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {q.pool_equipment_responses.map((r) => (
                        <span
                          key={r.id}
                          className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[color:var(--color-pool-700)] ring-1 ring-[color:var(--color-pool-200)]"
                        >
                          {r.profiles?.display_name ?? "מישהו"}: {r.item}
                        </span>
                      ))}
                    </div>
                  )}
                  {authed && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {PRESET_ITEMS.map((item) => (
                        <button
                          key={item}
                          onClick={() => respond(q.id, item)}
                          className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[color:var(--color-ink-2)] ring-1 ring-[color:var(--color-pool-200)] hover:ring-[color:var(--color-pool-400)] transition-all"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      )}
    </section>
  );
}
