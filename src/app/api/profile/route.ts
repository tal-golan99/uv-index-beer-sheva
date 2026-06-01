import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase-server";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdmin();

  const { data: existing, error: selectError } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    console.error("[profile GET] select error", { userId: user.id, code: selectError.code, message: selectError.message, details: selectError.details });
    return NextResponse.json({ error: "שגיאה בטעינת הפרופיל." }, { status: 500 });
  }

  if (existing) return NextResponse.json(existing);

  // Profile row missing — create it now
  const meta = user.user_metadata ?? {};
  const { data: created, error: insertError } = await admin
    .from("profiles")
    .insert({
      id: user.id,
      display_name: meta.full_name ?? meta.name ?? null,
      avatar_url: meta.avatar_url ?? meta.picture ?? null,
    })
    .select()
    .single();

  if (insertError) {
    console.error("[profile GET] insert error", { userId: user.id, code: insertError.code, message: insertError.message, details: insertError.details });
    return NextResponse.json({ error: "שגיאה ביצירת פרופיל." }, { status: 500 });
  }
  return NextResponse.json(created);
}

export async function PUT(request: Request) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const allowed = [
    "display_name",
    "avatar_url",
    "phone",
    "telegram_chat_id",
    "email_notifications",
    "phone_notifications",
    "active",
    "onboarding_completed",
  ];
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  const admin = getAdmin();

  const { data, error } = await admin
    .from("profiles")
    .update(patch)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    console.error("[profile PUT] update error", { userId: user.id, code: error.code, message: error.message, details: error.details });
    return NextResponse.json({ error: "שגיאה בשמירת הפרופיל." }, { status: 500 });
  }

  // Keep pool_presence in sync so the live pool shows the updated avatar immediately.
  if ("avatar_url" in patch) {
    await admin
      .from("pool_presence")
      .update({ avatar_url: patch.avatar_url ?? null })
      .eq("user_id", user.id);
  }

  return NextResponse.json(data);
}
