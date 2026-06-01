"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

interface Comment {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)   return "עכשיו";
  if (diff < 3600) return `לפני ${Math.floor(diff / 60)} דק׳`;
  if (diff < 86400) return `לפני ${Math.floor(diff / 3600)} שעות`;
  return `לפני ${Math.floor(diff / 86400)} ימים`;
}

export default function CommentsSection() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [authed, setAuthed] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setAuthed(!!user));
    load();
  }, [supabase]);

  async function load() {
    const res = await fetch("/api/comments");
    if (res.ok) setComments(await res.json());
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    setText("");
    setPosting(false);
    await load();
  }

  return (
    <section className="space-y-4">
      <h2 className="px-1 text-lg font-extrabold text-[color:var(--color-ink)] md:text-xl">
        💬 תגובות
      </h2>

      {/* Input */}
      {authed ? (
        <form onSubmit={submit} className="flex gap-2">
          <input
            type="text"
            placeholder="כתוב משהו..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm text-[color:var(--color-ink)] placeholder-[color:var(--color-ink-3)] ring-1 ring-[color:var(--color-pool-200)] outline-none focus:ring-2 focus:ring-[color:var(--color-pool-400)]"
          />
          <button
            type="submit"
            disabled={posting || !text.trim()}
            className="rounded-2xl px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))" }}
          >
            {posting ? "..." : "שלח"}
          </button>
        </form>
      ) : (
        <p className="text-sm text-[color:var(--color-ink-3)] text-center">
          <a href="/register" className="font-bold text-[color:var(--color-pool-600)] underline">הירשם</a> כדי להגיב
        </p>
      )}

      {/* Comment list */}
      <div className="space-y-2">
        {comments.length === 0 && (
          <p className="text-center text-sm text-[color:var(--color-ink-3)] py-3">עוד אין תגובות. היה הראשון!</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="radius-nested shadow-pool-sm bg-white p-3 flex gap-3 ring-1 ring-[color:var(--color-pool-100)]">
            <div className="shrink-0 h-8 w-8 rounded-full overflow-hidden bg-[color:var(--color-pool-100)] grid place-items-center text-sm">
              {c.profiles?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.profiles.avatar_url} alt={c.profiles.display_name ?? ""} className="h-full w-full object-cover" />
              ) : (
                <span>🏊</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-extrabold text-[color:var(--color-ink)]">
                  {c.profiles?.display_name ?? "שחיין"}
                </span>
                <span className="text-[10px] text-[color:var(--color-ink-3)]">{timeAgo(c.created_at)}</span>
              </div>
              <p className="mt-0.5 text-sm text-[color:var(--color-ink-2)] break-words">{c.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
