import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase-server";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { item } = await request.json();
  if (!item) return NextResponse.json({ error: "Missing item" }, { status: 400 });

  const admin = getAdmin();

  const { data: profile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const name = (profile?.display_name as string | null) ?? "מישהו";

  // Broadcast only — no DB entry
  const { data: telegramProfiles } = await admin
    .from("profiles")
    .select("telegram_chat_id")
    .not("telegram_chat_id", "is", null);

  const chatIds = (telegramProfiles ?? []).map((p) => p.telegram_chat_id as string);
  const text = `❓ ${name} שואל: מי מביא ${item}?`;

  await Promise.allSettled(
    chatIds.map((chatId) =>
      fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      })
    )
  );

  return NextResponse.json({ ok: true });
}
