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

  if (action === "out") {
    await admin.from("pool_presence").delete().eq("user_id", user.id);
    return NextResponse.json({ ok: true, action: "out" });
  }

  // action === "in" — get display info from profile
  const { data: profile } = await admin
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, action: "in" });
}
