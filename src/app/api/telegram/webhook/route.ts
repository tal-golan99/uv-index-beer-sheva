import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function sendMessage(chatId: string | number, text: string, replyMarkup?: unknown) {
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, ...(replyMarkup ? { reply_markup: replyMarkup } : {}) }),
    }
  );
}

async function answerCallbackQuery(callbackQueryId: string) {
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQueryId }),
    }
  );
}

/** Build the date picker keyboard for the next 7 days. */
function buildDateKeyboard() {
  const now = new Date();
  const tz = "Asia/Jerusalem";
  const buttons = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dateStr = d.toLocaleDateString("en-CA", { timeZone: tz }); // YYYY-MM-DD
    const label = i === 0 ? "היום 🏊" : i === 1 ? "מחר ☀️" : d.toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "numeric", timeZone: tz });
    buttons.push([{ text: label, callback_data: `invite:date:${dateStr}` }]);
  }

  return { inline_keyboard: buttons };
}

/** Build the time picker keyboard for a specific date. */
function buildTimeKeyboard(dateStr: string) {
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  const rows: { text: string; callback_data: string }[][] = [];

  for (let i = 0; i < hours.length; i += 4) {
    rows.push(
      hours.slice(i, i + 4).map((h) => ({
        text: `${h}:00`,
        callback_data: `invite:time:${dateStr}:${h}`,
      }))
    );
  }

  return { inline_keyboard: rows };
}

/** Broadcast an invite to all Telegram-connected users and return Google Calendar URL. */
async function broadcastInvite(fromChatId: string, dateStr: string, hour: number) {
  const admin = getAdmin();

  // Find inviter's display name
  const { data: inviter } = await admin
    .from("profiles")
    .select("display_name")
    .eq("telegram_chat_id", fromChatId)
    .maybeSingle();

  const inviterName = (inviter?.display_name as string | null) ?? "מישהו";

  // Format date for display
  const dateDisplay = new Date(`${dateStr}T${String(hour).padStart(2, "0")}:00:00`)
    .toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Jerusalem" });

  // Google Calendar deep-link (no OAuth needed)
  const start = `${dateStr.replace(/-/g, "")}T${String(hour).padStart(2, "0")}0000`;
  const end   = `${dateStr.replace(/-/g, "")}T${String(Math.min(hour + 2, 23)).padStart(2, "0")}0000`;
  const calUrl = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent("בריכה 🏊")}&dates=${start}/${end}&details=${encodeURIComponent("זימון לבריכה")}&location=${encodeURIComponent("בריכת אוניברסיטת בן גוריון, באר שבע")}`;

  const inviteText =
    `🏊 ${inviterName} מזמין לבריכה!\n` +
    `📅 ${dateDisplay} בשעה ${hour}:00\n\n` +
    `לחצו להוסיף ליומן 👇`;

  // Fetch all chat IDs except the sender
  const { data: profiles } = await admin
    .from("profiles")
    .select("telegram_chat_id")
    .not("telegram_chat_id", "is", null)
    .neq("telegram_chat_id", fromChatId);

  const keyboard = { inline_keyboard: [[{ text: "📅 הוסף ל-Google Calendar", url: calUrl }]] };
  const recipients = (profiles ?? []).map((p) => p.telegram_chat_id as string);

  await Promise.allSettled(
    recipients.map((chatId) => sendMessage(chatId, inviteText, keyboard))
  );

  return { calUrl, dateDisplay, hour };
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // ── Callback query (inline button taps) ──────────────────────────────────
  const cq = body?.callback_query;
  if (cq) {
    const chatId = String(cq.message?.chat?.id ?? cq.from?.id);
    const data: string = cq.data ?? "";
    await answerCallbackQuery(cq.id);

    if (data === "invite:start") {
      await sendMessage(chatId, "בחר תאריך לבריכה:", buildDateKeyboard());
    } else if (data.startsWith("invite:date:")) {
      const dateStr = data.slice("invite:date:".length);
      await sendMessage(chatId, `בחרת ${dateStr}. עכשיו בחר שעה:`, buildTimeKeyboard(dateStr));
    } else if (data.startsWith("invite:time:")) {
      const [, , dateStr, hourStr] = data.split(":");
      const hour = parseInt(hourStr);
      const { calUrl, dateDisplay } = await broadcastInvite(chatId, dateStr, hour);
      await sendMessage(
        chatId,
        `✅ הזימון נשלח לכולם!\n${dateDisplay} בשעה ${hour}:00\n\nלהוסיף ליומן שלך:`,
        { inline_keyboard: [[{ text: "📅 Google Calendar", url: calUrl }]] }
      );
    }

    return NextResponse.json({ ok: true });
  }

  // ── Regular message ───────────────────────────────────────────────────────
  const message = body?.message;
  if (!message) return NextResponse.json({ ok: true });

  const text: string = message.text ?? "";
  const chatId = String(message.chat.id);

  if (text.startsWith("/start")) {
    const token = text.slice(6).trim();

    if (!token) {
      await sendMessage(chatId, "שלח לינק מהאפליקציה כדי להירשם להתראות UV 🌞");
      return NextResponse.json({ ok: true });
    }

    const admin = getAdmin();
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

    await admin.from("profiles").update({ telegram_chat_id: chatId }).eq("id", row.user_id);
    await admin.from("pending_telegram_tokens").delete().eq("token", token);

    const photoUrl = `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?step=photo`;
    await sendMessage(
      chatId,
      "מעולה! 🎉 נרשמת בהצלחה להתראות ה-UV.\n" +
        "מעכשיו נשלח לך התראה כשהשמש חזקה מדי — שעה לפני השיא ובשיא עצמו ☀️\n\n" +
        "נשאר רק צעד אחד: בוא נבחר תמונת פרופיל ונסיים את ההרשמה 👇",
      { inline_keyboard: [[{ text: "🏊 השלם הרשמה ובחר תמונה", url: photoUrl }]] }
    );
  }

  if (text === "/invite" || text.startsWith("/invite ")) {
    await sendMessage(chatId, "בחר תאריך לבריכה:", buildDateKeyboard());
  }

  return NextResponse.json({ ok: true });
}
