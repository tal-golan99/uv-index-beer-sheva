"use client";

import { useEffect, useState } from "react";
import { PersonSimpleSwim, ChatCircleDots } from "@phosphor-icons/react";

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
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    fetch("/api/comments")
      .then((r) => r.ok ? r.json() : [])
      .then(setComments);
  }, []);

  if (comments.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="px-1 text-lg font-extrabold text-[color:var(--color-ink)] md:text-xl">
          תגובות
        </h2>
        <div className="radius-nested bg-[color:var(--color-pool-50)] px-5 py-8 text-center ring-1 ring-[color:var(--color-pool-100)]">
          <ChatCircleDots size={40} weight="duotone" color="var(--color-pool-400)" className="mx-auto mb-2" aria-hidden />
          <p className="text-base font-bold text-[color:var(--color-ink-2)]">היה הראשון להגיב</p>
          <p className="mt-1 text-sm text-[color:var(--color-ink-3)]">
            את הטקסט כותבים{" "}
            <a href="/account" className="font-bold text-[color:var(--color-pool-600)] hover:underline">
              בעמוד החשבון
            </a>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="px-1 text-lg font-extrabold text-[color:var(--color-ink)] md:text-xl">
        תגובות
      </h2>
      <div className="space-y-2">
        {comments.map((c) => (
          <div key={c.id} className="radius-nested shadow-pool-sm bg-white p-3 flex gap-3 ring-1 ring-[color:var(--color-pool-100)]">
            <div className="shrink-0 h-8 w-8 rounded-full overflow-hidden bg-[color:var(--color-pool-100)] grid place-items-center text-sm">
              {c.profiles?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.profiles.avatar_url} alt={c.profiles.display_name ?? ""} className="h-full w-full object-cover" />
              ) : (
                <PersonSimpleSwim size={18} weight="duotone" color="var(--color-pool-500)" aria-hidden />
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
