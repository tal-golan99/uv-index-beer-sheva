import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase-server";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = crypto.randomUUID();
  const admin = getAdmin();

  // Upsert — one pending token per user
  await admin.from("pending_telegram_tokens").delete().eq("user_id", user.id);
  const { error } = await admin.from("pending_telegram_tokens").insert({
    token,
    user_id: user.id,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    token,
    botUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME,
  });
}
