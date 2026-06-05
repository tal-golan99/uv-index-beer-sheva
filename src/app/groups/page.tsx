"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  UsersThree,
  Copy,
  Check,
  Bell,
  BellSlash,
  CaretDown,
  CaretUp,
  User,
  X,
} from "@phosphor-icons/react";
import Wordmark from "@/components/Wordmark";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

interface PoolGroup {
  id: string;
  name: string;
  invite_code: string;
  created_by: string | null;
  notifications_enabled: boolean;
}

interface GroupMember {
  user_id: string;
  joined_at: string;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
}

export default function GroupsPage() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<PoolGroup[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [createError, setCreateError] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Leave confirmation
  const [confirmLeave, setConfirmLeave] = useState<{ groupId: string; groupName: string } | null>(null);
  const [leaving, setLeaving] = useState(false);

  // Member list
  const [membersOpen, setMembersOpen] = useState<Record<string, boolean>>({});
  const [membersCache, setMembersCache] = useState<Record<string, GroupMember[]>>({});
  const [membersLoading, setMembersLoading] = useState<Record<string, boolean>>({});

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
    setCreateError("");
    setCreatingGroup(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName.trim() }),
      });
      if (res.ok) {
        const g: PoolGroup = await res.json();
        setGroups((prev) => [{ ...g, notifications_enabled: true }, ...prev]);
        setNewGroupName("");
      } else {
        const body = await res.json().catch(() => ({}));
        setCreateError(body.error ?? "לא הצלחנו ליצור את הקבוצה. נסה שוב.");
      }
    } catch {
      setCreateError("שגיאת רשת. בדוק את החיבור ונסה שוב.");
    } finally {
      setCreatingGroup(false);
    }
  }

  async function leaveGroup(groupId: string) {
    setLeaving(true);
    try {
      await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
    } finally {
      setLeaving(false);
      setConfirmLeave(null);
    }
  }

  async function toggleNotifications(groupId: string, current: boolean) {
    const next = !current;
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, notifications_enabled: next } : g))
    );
    try {
      await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications_enabled: next }),
      });
    } catch {
      // revert on error
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, notifications_enabled: current } : g))
      );
    }
  }

  async function loadMembers(groupId: string) {
    const isOpen = membersOpen[groupId];
    setMembersOpen((prev) => ({ ...prev, [groupId]: !isOpen }));
    if (isOpen || membersCache[groupId]) return;

    setMembersLoading((prev) => ({ ...prev, [groupId]: true }));
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setMembersCache((prev) => ({ ...prev, [groupId]: data as GroupMember[] }));
      }
    } finally {
      setMembersLoading((prev) => ({ ...prev, [groupId]: false }));
    }
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
    <main dir="rtl" className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-sm space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-[color:var(--color-ink-2)] transition-all hover:bg-[color:var(--color-pool-50)] hover:text-[color:var(--color-pool-600)] cursor-pointer"
          >
            <ArrowRight size={16} aria-hidden /> חזרה
          </Link>
          <Wordmark size="sm" />
        </div>

        <div className="flex items-center gap-2.5">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm"
            style={{ background: "linear-gradient(135deg, var(--color-pool-500), var(--color-pool-400))" }}
          >
            <UsersThree size={22} weight="duotone" color="white" aria-hidden />
          </div>
          <h1 className="text-2xl font-black text-[color:var(--color-ink)]">הקבוצות שלי</h1>
        </div>

        {/* Create group card */}
        <div className="rounded-3xl bg-white p-5 ring-1 ring-[color:var(--color-pool-100)] shadow-sm space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wide text-[color:var(--color-ink-3)]">קבוצה חדשה</h2>
          <form onSubmit={createGroup} className="flex gap-2">
            <input
              type="text"
              placeholder="שם הקבוצה"
              value={newGroupName}
              onChange={(e) => { setNewGroupName(e.target.value); setCreateError(""); }}
              maxLength={60}
              className="w-full rounded-xl bg-[color:var(--color-pool-50)] px-4 py-3 text-base text-[color:var(--color-ink)] placeholder-[color:var(--color-ink-3)] ring-1 ring-[color:var(--color-pool-100)] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[color:var(--color-pool-400)]"
            />
            <button
              type="submit"
              disabled={creatingGroup || !newGroupName.trim()}
              className="shrink-0 rounded-2xl px-5 py-3 text-sm font-extrabold text-white disabled:opacity-40 transition-all hover:opacity-90 active:scale-95 cursor-pointer"
              style={{ background: "linear-gradient(135deg, var(--color-pool-600), var(--color-pool-400))" }}
            >
              {creatingGroup ? "..." : "צור"}
            </button>
          </form>
          {createError && (
            <p className="text-sm font-semibold text-red-500" role="alert">{createError}</p>
          )}
        </div>

        {/* Groups list */}
        {groups.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 ring-1 ring-[color:var(--color-pool-100)] shadow-sm text-center space-y-3">
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl"
              style={{ background: "linear-gradient(135deg, var(--color-pool-100), var(--color-pool-50))" }}
            >
              <UsersThree size={32} weight="duotone" color="var(--color-pool-400)" aria-hidden />
            </div>
            <p className="text-base font-bold text-[color:var(--color-ink-2)]">עוד אין קבוצות</p>
            <p className="text-sm text-[color:var(--color-ink-3)]">צור קבוצה ושלח לינק לחברים להצטרף</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => {
              const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/groups/${g.invite_code}`;
              const waUrl = `https://wa.me/?text=${encodeURIComponent(`הצטרף לקבוצת הבריכה "${g.name}" 🏊\n${inviteUrl}`)}`;
              const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(`הצטרף לקבוצת הבריכה "${g.name}" 🏊`)}`;
              const isOpen = membersOpen[g.id];
              const members = membersCache[g.id];
              const isLoadingMembers = membersLoading[g.id];

              return (
                <div
                  key={g.id}
                  className="rounded-3xl bg-white ring-1 ring-[color:var(--color-pool-100)] shadow-sm overflow-hidden transition-shadow hover:shadow-md"
                >
                  {/* Card header: name + bell toggle */}
                  <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: "linear-gradient(135deg, var(--color-pool-100), var(--color-pool-50))" }}
                      >
                        <UsersThree size={18} weight="duotone" color="var(--color-pool-600)" aria-hidden />
                      </div>
                      <p className="text-base font-extrabold text-[color:var(--color-ink)] truncate">{g.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleNotifications(g.id, g.notifications_enabled)}
                      aria-label={g.notifications_enabled ? "כבה התראות לקבוצה" : "הפעל התראות לקבוצה"}
                      title={g.notifications_enabled ? "התראות פועלות — לחץ לכיבוי" : "התראות כבויות — לחץ להפעלה"}
                      className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
                      style={{
                        background: g.notifications_enabled
                          ? "linear-gradient(135deg, var(--color-pool-500), var(--color-pool-400))"
                          : "var(--color-pool-50)",
                        boxShadow: g.notifications_enabled ? "0 2px 8px rgba(0,120,200,0.25)" : "none",
                      }}
                    >
                      {g.notifications_enabled ? (
                        <Bell size={17} weight="duotone" color="white" aria-hidden />
                      ) : (
                        <BellSlash size={17} weight="duotone" color="var(--color-ink-3)" aria-hidden />
                      )}
                    </button>
                  </div>

                  {/* Invite sharing */}
                  <div className="px-5 pb-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-3)]">שתף לינק הצטרפות</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => copyInviteLink(g.invite_code)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[color:var(--color-pool-50)] px-3 py-2.5 text-sm font-bold text-[color:var(--color-pool-700)] ring-1 ring-[color:var(--color-pool-200)] transition-all hover:ring-[color:var(--color-pool-400)] hover:bg-[color:var(--color-pool-100)] cursor-pointer"
                      >
                        {copiedCode === g.invite_code ? (
                          <><Check size={15} weight="bold" aria-hidden /> הועתק!</>
                        ) : (
                          <><Copy size={15} weight="bold" aria-hidden /> העתק לינק</>
                        )}
                      </button>
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-green-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-600 transition-colors cursor-pointer"
                      >
                        WhatsApp
                      </a>
                      <a
                        href={tgUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 cursor-pointer"
                        style={{ background: "linear-gradient(135deg, #229ED9, #1A7BBF)" }}
                      >
                        Telegram
                      </a>
                    </div>
                  </div>

                  {/* Members toggle row */}
                  <button
                    type="button"
                    onClick={() => loadMembers(g.id)}
                    className="flex w-full items-center justify-between gap-2 border-t border-[color:var(--color-pool-100)] px-5 py-3 text-sm font-semibold text-[color:var(--color-ink-2)] transition-colors hover:bg-[color:var(--color-pool-50)] cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <UsersThree size={15} weight="duotone" color="var(--color-pool-500)" aria-hidden />
                      {isOpen ? "הסתר חברים" : "הצג חברים"}
                    </span>
                    {isOpen ? (
                      <CaretUp size={15} weight="bold" color="var(--color-ink-3)" aria-hidden />
                    ) : (
                      <CaretDown size={15} weight="bold" color="var(--color-ink-3)" aria-hidden />
                    )}
                  </button>

                  {/* Members panel */}
                  {isOpen && (
                    <div className="border-t border-[color:var(--color-pool-100)] px-5 py-4 space-y-2.5 bg-[color:var(--color-pool-50)]">
                      {isLoadingMembers ? (
                        <div className="flex justify-center py-3">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[color:var(--color-pool-200)] border-t-[color:var(--color-pool-500)]" />
                        </div>
                      ) : !members || members.length === 0 ? (
                        <p className="text-center text-sm text-[color:var(--color-ink-3)] py-2">אין חברים בקבוצה</p>
                      ) : (
                        members.map((m) => {
                          const name = m.profiles?.display_name ?? "משתמש";
                          const avatar = m.profiles?.avatar_url;
                          return (
                            <div key={m.user_id} className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-white shadow-sm">
                                {avatar ? (
                                  <img src={avatar} alt={name} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-[color:var(--color-pool-200)]">
                                    <User size={15} weight="duotone" color="var(--color-pool-600)" aria-hidden />
                                  </div>
                                )}
                              </div>
                              <span className="text-sm font-semibold text-[color:var(--color-ink-2)]">{name}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Leave footer */}
                  <div className="border-t border-[color:var(--color-pool-100)] px-5 py-3">
                    <button
                      type="button"
                      onClick={() => setConfirmLeave({ groupId: g.id, groupName: g.name })}
                      className="text-sm font-semibold text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      עזוב קבוצה
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Leave confirmation modal */}
      {confirmLeave && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmLeave(null); }}
        >
          <div
            className="w-full max-w-xs rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-[color:var(--color-pool-100)] space-y-4"
            dir="rtl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50">
                <UsersThree size={22} weight="duotone" color="#ef4444" aria-hidden />
              </div>
              <button
                type="button"
                onClick={() => setConfirmLeave(null)}
                aria-label="סגור"
                className="flex h-8 w-8 items-center justify-center rounded-xl text-[color:var(--color-ink-3)] hover:bg-[color:var(--color-pool-50)] transition-colors cursor-pointer"
              >
                <X size={18} weight="bold" aria-hidden />
              </button>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-extrabold text-[color:var(--color-ink)]">עזיבת קבוצה</h2>
              <p className="text-sm text-[color:var(--color-ink-2)] leading-relaxed">
                האם אתה בטוח שברצונך לעזוב את הקבוצה{" "}
                <span className="font-bold text-[color:var(--color-ink)]">&quot;{confirmLeave.groupName}&quot;</span>?
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmLeave(null)}
                className="flex-1 rounded-2xl bg-[color:var(--color-pool-50)] px-4 py-3 text-sm font-bold text-[color:var(--color-ink-2)] ring-1 ring-[color:var(--color-pool-100)] hover:bg-[color:var(--color-pool-100)] transition-colors cursor-pointer"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={() => leaveGroup(confirmLeave.groupId)}
                disabled={leaving}
                className="flex-1 rounded-2xl bg-red-500 px-4 py-3 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {leaving ? "עוזב..." : "עזוב"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
