import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function sendMessage(chatId: string | number, text: string) {
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    }
  );
}

export async function POST(req: NextRequest) {
  // Verify the request is from Telegram
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const message = body?.message;
  if (!message) return NextResponse.json({ ok: true });

  const text: string = message.text ?? "";
  const chatId = String(message.chat.id);

  if (text.startsWith("/start")) {
    const token = text.slice(6).trim(); // "/start <token>"

    if (!token) {
      await sendMessage(chatId, "שלח לינק מהאפליקציה כדי להירשם להתראות UV 🌞");
      return NextResponse.json({ ok: true });
    }

    const admin = getAdmin();

    // Look up the token
    const { data: row } = await admin
      .from("pending_telegram_tokens")
      .select("user_id, expires_at")
      .eq("token", token)
      .single();

    if (!row) {
      await sendMessage(chatId, "הלינק לא תקף או פג תוקפו. חזור לאפליקציה ונסה שוב.");
      return NextResponse.json({ ok: true });
    }

    if (new Date(row.expires_at) < new Date()) {
      await admin.from("pending_telegram_tokens").delete().eq("token", token);
      await sendMessage(chatId, "הלינק פג תוקף. חזור לאפליקציה וצור לינק חדש.");
      return NextResponse.json({ ok: true });
    }

    // Store the chat_id in profiles
    await admin.from("profiles").update({ telegram_chat_id: chatId }).eq("id", row.user_id);
    await admin.from("pending_telegram_tokens").delete().eq("token", token);

    await sendMessage(chatId, "מחובר! 🎉 תחזור לאפליקציה — תקבל התראות UV כשהשמש חזקה מדי 🌞");
  }

  return NextResponse.json({ ok: true });
}
