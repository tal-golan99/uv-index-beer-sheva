import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase-server";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST { action: "in" | "out" }
export async function POST(request: Request) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action } = await request.json();
  const admin = getAdmin();

  // Keep the table tidy: drop anyone checked in more than 4 hours ago. The
  // pg_cron job does this server-side every 5 min; doing it here too means user
  // activity also cleans up stale rows between ticks.
  const staleCutoff = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
  const { error: staleError } = await admin
    .from("pool_presence")
    .delete()
    .lt("checked_in_at", staleCutoff);
  if (staleError) console.error("[checkin] stale cleanup error", { code: staleError.code, message: staleError.message });

  if (action === "out") {
    const { error: delError } = await admin.from("pool_presence").delete().eq("user_id", user.id);
    if (delError) console.error("[checkin] delete error", { userId: user.id, code: delError.code, message: delError.message });
    return NextResponse.json({ ok: true, action: "out" });
  }

  // action === "in" — get display info from profile
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (profileError) console.error("[checkin] profile fetch error", { userId: user.id, code: profileError.code, message: profileError.message });

  const meta = user.user_metadata ?? {};
  const displayName =
    profile?.display_name ?? meta.full_name ?? meta.name ?? "שחיין";
  const avatarUrl = profile?.avatar_url ?? meta.avatar_url ?? meta.picture ?? null;

  const { error } = await admin.from("pool_presence").upsert(
    {
      user_id: user.id,
      display_name: displayName,
      avatar_url: avatarUrl,
      checked_in_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[checkin] upsert error", { userId: user.id, code: error.code, message: error.message, details: error.details, hint: error.hint });
    return NextResponse.json({ error: "שגיאה. נסה שוב." }, { status: 500 });
  }

  // Record today's visit in history (Asia/Jerusalem date). Ignore if already logged today.
  // A failure here must not break check-in, so we only log it.
  const visitDate = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
  const { error: visitError } = await admin
    .from("pool_visits")
    .upsert(
      { user_id: user.id, visit_date: visitDate },
      { onConflict: "user_id,visit_date", ignoreDuplicates: true }
    );
  if (visitError) console.error("[checkin] visit log error", { userId: user.id, code: visitError.code, message: visitError.message });

  return NextResponse.json({ ok: true, action: "in" });
}
