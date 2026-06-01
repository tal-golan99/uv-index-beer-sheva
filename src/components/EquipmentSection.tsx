"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

const PRESET_ITEMS = ["🍺 בירות", "🧊 קרח", "🍉 אבטיח", "🎒 תרמיל", "🧴 שמן הגנה", "🔊 רמקול", "🥏 פריסבי"];

interface Response {
  id: string;
  user_id: string;
  item: string;
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
  const [userId, setUserId] = useState<string | null>(null);
  const [queries, setQueries] = useState<Query[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [posting, setPosting] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setAuthed(true); setUserId(user.id); }
    });
    loadQueries();
  }, [supabase]);

  async function loadQueries() {
    const res = await fetch("/api/equipment");
    if (res.ok) setQueries(await res.json());
  }

  async function postQuery(e: React.FormEvent) {
    e.preventDefault();
    setPosting(true);
    await fetch("/api/equipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: newMessage || null }),
    });
    setNewMessage("");
    setPosting(false);
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
          {/* New query form */}
          {authed && (
            <form onSubmit={postQuery} className="space-y-2">
              <input
                type="text"
                placeholder="מה חסר? (אופציונלי)"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                maxLength={120}
                className="w-full rounded-xl bg-[color:var(--color-pool-50)] px-4 py-2.5 text-sm text-[color:var(--color-ink)] placeholder-[color:var(--color-ink-3)] ring-1 ring-[color:var(--color-pool-200)] outline-none focus:ring-2 focus:ring-[color:var(--color-pool-400)]"
              />
              <button
                type="submit"
                disabled={posting}
                className="w-full rounded-2xl py-2.5 text-sm font-extrabold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))" }}
              >
                {posting ? "שולח..." : "שאל מי מביא ציוד"}
              </button>
            </form>
          )}

          {/* Query list */}
          {queries.length === 0 ? (
            <p className="text-center text-sm text-[color:var(--color-ink-3)] py-2">עוד אין שאלות להיום</p>
          ) : (
            <div className="space-y-4">
              {queries.map((q) => (
                <div key={q.id} className="rounded-2xl bg-[color:var(--color-pool-50)] p-3 space-y-2">
                  {q.message && (
                    <p className="text-sm font-semibold text-[color:var(--color-ink)]">{q.message}</p>
                  )}
                  {/* Responses */}
                  {q.pool_equipment_responses.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {q.pool_equipment_responses.map((r) => (
                        <span
                          key={r.id}
                          className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[color:var(--color-pool-700)] ring-1 ring-[color:var(--color-pool-200)]"
                        >
                          {r.item}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Respond buttons */}
                  {authed && !q.pool_equipment_responses.some((r) => r.user_id === userId) && (
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
