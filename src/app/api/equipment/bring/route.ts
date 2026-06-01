import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase-server";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function todayJerusalem() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { item } = await request.json();
  if (!item) return NextResponse.json({ error: "Missing item" }, { status: 400 });

  const admin = getAdmin();
  const today = todayJerusalem();

  // Find or create today's shared general query
  let { data: query } = await admin
    .from("pool_equipment_queries")
    .select("id")
    .eq("query_date", today)
    .is("message", null)
    .maybeSingle();

  if (!query) {
    const { data: newQuery, error } = await admin
      .from("pool_equipment_queries")
      .insert({ user_id: user.id, query_date: today, message: null })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    query = newQuery;
  }

  // Delete existing response for this user then insert fresh (avoids needing a unique constraint)
  await admin.from("pool_equipment_responses").delete().eq("query_id", query.id).eq("user_id", user.id);
  await admin.from("pool_equipment_responses").insert({ query_id: query.id, user_id: user.id, item });

  // Get bringer's display name
  const { data: profile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const name = (profile?.display_name as string | null) ?? "מישהו";

  // Broadcast to all Telegram-connected users (regardless of phone_notifications setting)
  try {
    const { data: telegramProfiles } = await admin
      .from("profiles")
      .select("telegram_chat_id")
      .not("telegram_chat_id", "is", null);

    const chatIds = (telegramProfiles ?? []).map((p) => p.telegram_chat_id as string);

    if (chatIds.length > 0) {
      const text = `👋 ${name} מביא ${item} לבריכה! 🏊`;
      await Promise.allSettled(
        chatIds.map((chatId) =>
          fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text }),
          })
        )
      );
    }
  } catch {
    // Notifications are best-effort
  }

  return NextResponse.json({ ok: true });
}
