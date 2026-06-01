"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import Wordmark from "@/components/Wordmark";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

interface PoolGroup {
  id: string;
  name: string;
  invite_code: string;
  created_by: string | null;
}

export default function GroupsPage() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<PoolGroup[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace("/register"); return; }
    });

    fetch("/api/groups")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setGroups(data as PoolGroup[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [supabase, router]);

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreatingGroup(true);
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newGroupName.trim() }),
    });
    if (res.ok) {
      const g: PoolGroup = await res.json();
      setGroups((prev) => [g, ...prev]);
      setNewGroupName("");
    }
    setCreatingGroup(false);
  }

  async function leaveGroup(groupId: string) {
    await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }

  function copyInviteLink(code: string) {
    const url = `${window.location.origin}/groups/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[color:var(--color-pool-200)] border-t-[color:var(--color-pool-500)]" />
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-sm space-y-6">
        <Link
          href="/"
          className="flex w-fit items-center gap-1.5 text-sm font-semibold text-[color:var(--color-ink-2)] transition-colors hover:text-[color:var(--color-pool-600)]"
        >
          <ArrowRight size={18} aria-hidden /> חזרה
        </Link>

        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-black text-[color:var(--color-ink)]">🏊 הקבוצות שלי</h1>
          <Wordmark size="sm" />
        </div>

        {/* Create group */}
        <div className="rounded-3xl bg-white p-6 ring-1 ring-[color:var(--color-pool-100)] shadow-pool-sm space-y-4">
          <h2 className="text-base font-extrabold text-[color:var(--color-ink)]">צור קבוצה חדשה</h2>
          <form onSubmit={createGroup} className="flex gap-2">
            <input
              type="text"
              placeholder="שם הקבוצה"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              maxLength={60}
              className="w-full rounded-xl bg-white px-4 py-3 text-base text-[color:var(--color-ink)] placeholder-[color:var(--color-ink-3)] ring-1 ring-[color:var(--color-pool-200)] outline-none transition-all focus:ring-2 focus:ring-[color:var(--color-pool-400)]"
            />
            <button
              type="submit"
              disabled={creatingGroup || !newGroupName.trim()}
              className="shrink-0 rounded-2xl px-5 py-3 text-base font-extrabold text-white disabled:opacity-50 transition-transform hover:scale-[1.02] active:scale-95"
              style={{ background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))" }}
            >
              {creatingGroup ? "..." : "צור"}
            </button>
          </form>
        </div>

        {/* Groups list */}
        <div className="space-y-3">
          {groups.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 ring-1 ring-[color:var(--color-pool-100)] shadow-pool-sm text-center">
              <p className="text-4xl mb-3">🏊</p>
              <p className="text-base font-semibold text-[color:var(--color-ink-2)]">עוד אין קבוצות</p>
              <p className="text-sm text-[color:var(--color-ink-3)] mt-1">צור קבוצה ושלח לינק לחברים להצטרף</p>
            </div>
          ) : (
            groups.map((g) => {
              const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/groups/${g.invite_code}`;
              const waUrl = `https://wa.me/?text=${encodeURIComponent(`הצטרף לקבוצת הבריכה "${g.name}" 🏊\n${inviteUrl}`)}`;
              const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(`הצטרף לקבוצת הבריכה "${g.name}" 🏊`)}`;

              return (
                <div key={g.id} className="rounded-3xl bg-white p-5 ring-1 ring-[color:var(--color-pool-100)] shadow-pool-sm space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-base font-extrabold text-[color:var(--color-ink)]">{g.name}</p>
                    <button
                      type="button"
                      onClick={() => leaveGroup(g.id)}
                      className="text-sm font-semibold text-red-500 hover:underline"
                    >
                      עזוב
                    </button>
                  </div>

                  <p className="text-sm text-[color:var(--color-ink-3)] -mt-2">שתף עם חברים כדי שיצטרפו:</p>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => copyInviteLink(g.invite_code)}
                      className="flex-1 rounded-xl bg-[color:var(--color-pool-50)] px-4 py-2.5 text-sm font-bold text-[color:var(--color-pool-700)] ring-1 ring-[color:var(--color-pool-200)] hover:ring-[color:var(--color-pool-400)] transition-all"
                    >
                      {copiedCode === g.invite_code ? "✓ הועתק!" : "📋 העתק לינק"}
                    </button>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-green-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-600 transition-colors"
                    >
                      WhatsApp
                    </a>
                    <a
                      href={tgUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors"
                      style={{ background: "linear-gradient(90deg, #229ED9, #1A7BBF)" }}
                    >
                      Telegram
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
