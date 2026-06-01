"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function MoreUVWaitlist() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [status, setStatus] = useState<"loading" | "loggedOut" | "joined" | "notJoined">("loading");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setStatus("loggedOut"); return; }
      const { data } = await supabase
        .from("profiles")
        .select("more_uv_interest")
        .eq("id", user.id)
        .maybeSingle();
      setStatus(data?.more_uv_interest ? "joined" : "notJoined");
    });
  }, [supabase]);

  async function join() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/register"; return; }
    await supabase.from("profiles").update({ more_uv_interest: true }).eq("id", user.id);
    setStatus("joined");
    setSaving(false);
  }

  if (status === "loading") return null;

  if (status === "joined") {
    return (
      <div className="rounded-2xl px-10 py-4 text-base font-extrabold text-white text-center"
        style={{ background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))" }}>
        ✅ נרשמת לרשימת ההמתנה!
      </div>
    );
  }

  if (status === "loggedOut") {
    return (
      <a
        href="/register"
        className="block rounded-2xl px-10 py-4 text-base font-extrabold text-white text-center transition-transform hover:scale-[1.02] active:scale-95"
        style={{ background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))" }}
      >
        הירשם כדי להצטרף לרשימת ההמתנה ✨
      </a>
    );
  }

  return (
    <button
      onClick={join}
      disabled={saving}
      className="w-full rounded-2xl px-10 py-4 text-base font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
      style={{ background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))" }}
    >
      {saving ? "שומר..." : "הצטרפות לרשימת ההמתנה ✨"}
    </button>
  );
}
