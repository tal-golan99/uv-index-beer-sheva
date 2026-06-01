"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

const PRESET_ITEMS = ["🍺 בירות", "🧊 קרח", "🍉 אבטיח", "🧴 קרם הגנה", "🔊 רמקול", "🥏 פריסבי"];

type Mode = "bring" | "ask" | "text";

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
  const [mode, setMode] = useState<Mode>("bring");
  const [customText, setCustomText] = useState("");
  const [announced, setAnnounced] = useState<Set<string>>(new Set());
  const [asked, setAsked] = useState<Set<string>>(new Set());

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
    if (!authed || posting) return;
    setPosting(item);
    const res = await fetch("/api/equipment/bring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item }),
    });
    setPosting(null);
    if (res.ok) {
      setAnnounced((prev) => new Set([...prev, item]));
      setTimeout(() => setAnnounced((prev) => { const s = new Set(prev); s.delete(item); return s; }), 4000);
      await loadQueries();
    }
  }

  async function askAbout(item: string) {
    if (!authed || posting) return;
    setPosting(item);
    const res = await fetch("/api/equipment/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item }),
    });
    setPosting(null);
    if (res.ok) {
      setAsked((prev) => new Set([...prev, item]));
      setTimeout(() => setAsked((prev) => { const s = new Set(prev); s.delete(item); return s; }), 4000);
    }
  }

  async function sendCustom() {
    if (!authed || !customText.trim() || posting) return;
    setPosting("text");
    await fetch("/api/equipment/bring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item: customText.trim() }),
    });
    setPosting(null);
    setCustomText("");
    await loadQueries();
  }

  const generalQuery = queries.find((q) => q.message === null);

  const TABS: { key: Mode; label: string }[] = [
    { key: "bring", label: "אני מביא" },
    { key: "ask",   label: "שואל" },
    { key: "text",  label: "טקסט" },
  ];

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

          {authed ? (
            <>
              {/* Mode selector */}
              <div className="flex rounded-full bg-[color:var(--color-pool-50)] p-0.5 ring-1 ring-[color:var(--color-pool-100)]">
                {TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setMode(key)}
                    className={`flex-1 rounded-full py-1.5 text-xs font-bold transition-all ${
                      mode === key
                        ? "bg-white shadow-sm text-[color:var(--color-pool-700)]"
                        : "text-[color:var(--color-ink-3)] hover:text-[color:var(--color-ink-2)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Bring / Ask — preset chips */}
              {(mode === "bring" || mode === "ask") && (
                <div className="space-y-1.5">
                  <p className="text-xs text-[color:var(--color-ink-3)]">
                    {mode === "bring" ? "בחר מה אתה מביא:" : "שאל לגבי:"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_ITEMS.map((item) => {
                      const done = mode === "bring" ? announced.has(item) : asked.has(item);
                      return (
                        <button
                          key={item}
                          onClick={() => mode === "bring" ? announce(item) : askAbout(item)}
                          disabled={posting !== null}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-all disabled:opacity-50 ${
                            done
                              ? "bg-green-50 text-green-700 ring-green-200"
                              : "bg-[color:var(--color-pool-50)] text-[color:var(--color-pool-700)] ring-[color:var(--color-pool-200)] hover:bg-[color:var(--color-pool-100)]"
                          }`}
                        >
                          {posting === item ? "..." : done ? `✓ ${item}` : item}
                        </button>
                      );
                    })}
                  </div>
                  {mode === "ask" && (
                    <p className="text-[11px] text-[color:var(--color-ink-3)]">
                      תישלח הודעה לכולם בטלגרם
                    </p>
                  )}
                </div>
              )}

              {/* Free text mode */}
              {mode === "text" && (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendCustom()}
                      placeholder="כתוב מה אתה מביא..."
                      className="flex-1 rounded-2xl border border-[color:var(--color-pool-200)] px-4 py-2 text-sm outline-none focus:border-[color:var(--color-pool-400)] text-right"
                      dir="rtl"
                    />
                    <button
                      onClick={sendCustom}
                      disabled={!customText.trim() || posting !== null}
                      className="rounded-2xl bg-[color:var(--color-pool-600)] px-4 py-2 text-xs font-bold text-white disabled:opacity-50 hover:bg-[color:var(--color-pool-700)] transition-colors"
                    >
                      {posting === "text" ? "..." : "שלח"}
                    </button>
                  </div>
                  <p className="text-[11px] text-[color:var(--color-ink-3)]">
                    תישלח הודעה לכולם בטלגרם
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-[color:var(--color-ink-2)]">
              <a href="/login" className="font-bold text-[color:var(--color-pool-600)] hover:underline">התחבר</a>
              {" "}כדי להכריז מה אתה מביא לבריכה
            </p>
          )}

          {/* "Brings" list — only from the shared daily query */}
          {generalQuery && generalQuery.pool_equipment_responses.length > 0 && (
            <div className="rounded-2xl bg-[color:var(--color-pool-50)] p-3">
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

        </div>
      )}
    </section>
  );
}
