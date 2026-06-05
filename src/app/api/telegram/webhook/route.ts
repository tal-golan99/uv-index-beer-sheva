import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendCalendarInviteEmails } from "@/lib/calendar-invite";

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

const BRING_ITEMS = ["🍺 בירות", "🧊 קרח", "🍉 אבטיח", "🧴 קרם הגנה", "🔊 רמקול", "🥏 פריסבי"];

/** Inline keyboard for /bring — preset items 3 per row. */
function buildBringKeyboard() {
  const rows: { text: string; callback_data: string }[][] = [];
  for (let i = 0; i < BRING_ITEMS.length; i += 3) {
    rows.push(
      BRING_ITEMS.slice(i, i + 3).map((item) => ({
        text: item,
        callback_data: `bring:item:${item}`,
      }))
    );
  }
  return { inline_keyboard: rows };
}

/** Inline keyboard for /ask — same items as /bring but different callback prefix. */
function buildAskKeyboard() {
  const rows: { text: string; callback_data: string }[][] = [];
  for (let i = 0; i < BRING_ITEMS.length; i += 3) {
    rows.push(
      BRING_ITEMS.slice(i, i + 3).map((item) => ({
        text: item,
        callback_data: `ask:item:${item}`,
      }))
    );
  }
  return { inline_keyboard: rows };
}

/** Inline keyboard for /later — hour options 08:00–18:00, 3 per row. */
function buildLaterKeyboard() {
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  const rows: { text: string; callback_data: string }[][] = [];
  for (let i = 0; i < hours.length; i += 4) {
    rows.push(
      hours.slice(i, i + 4).map((h) => ({
        text: `${h}:00`,
        callback_data: `later:time:${h}`,
      }))
    );
  }
  return { inline_keyboard: rows };
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

  // Fetch all profiles (telegram + email) for broadcast
  const { data: profiles } = await admin
    .from("profiles")
    .select("telegram_chat_id, email")
    .not("telegram_chat_id", "is", null)
    .neq("telegram_chat_id", fromChatId);

  const keyboard = { inline_keyboard: [[{ text: "📅 הוסף ל-Google Calendar", url: calUrl }]] };
  const recipients = (profiles ?? []).map((p) => p.telegram_chat_id as string);

  await Promise.allSettled(
    recipients.map((chatId) => sendMessage(chatId, inviteText, keyboard))
  );

  // Also send ICS calendar invite via email to all users who have an email
  const allEmails = (profiles ?? [])
    .map((p) => (p as { email?: string | null }).email)
    .filter((e): e is string => Boolean(e));

  await sendCalendarInviteEmails({
    emails: allEmails,
    dateStr,
    hour,
    organizer: inviterName,
  });

  return { calUrl, dateDisplay, hour };
}

/** Announce bring item — calls the equipment/bring API and broadcasts. */
async function handleBring(fromChatId: string, item: string) {
  const admin = getAdmin();

  // Look up the user's profile by telegram_chat_id
  const { data: profile } = await admin
    .from("profiles")
    .select("id, display_name")
    .eq("telegram_chat_id", fromChatId)
    .maybeSingle();

  if (!profile) {
    await sendMessage(fromChatId, "לא מצאתי את הפרופיל שלך. נסה להתחבר מחדש דרך האפליקציה.");
    return;
  }

  const name = (profile.display_name as string | null) ?? "מישהו";
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });

  // Find or create today's shared general query
  let { data: query } = await admin
    .from("pool_equipment_queries")
    .select("id")
    .eq("query_date", today)
    .is("message", null)
    .maybeSingle();

  if (!query) {
    const { data: newQ } = await admin
      .from("pool_equipment_queries")
      .insert({ user_id: profile.id, query_date: today, message: null })
      .select("id")
      .single();
    query = newQ;
  }

  if (query) {
    await admin
      .from("pool_equipment_responses")
      .upsert({ query_id: query.id, user_id: profile.id, item }, { onConflict: "query_id,user_id" });
  }

  // Broadcast to all others
  const broadcastText = `👋 ${name} מביא ${item} לבריכה! 🏊`;
  const { data: others } = await admin
    .from("profiles")
    .select("telegram_chat_id")
    .not("telegram_chat_id", "is", null)
    .neq("telegram_chat_id", fromChatId);

  const recipients = (others ?? []).map((p) => p.telegram_chat_id as string);
  await Promise.allSettled(recipients.map((id) => sendMessage(id, broadcastText)));
  await sendMessage(fromChatId, `✅ עדכנו את כולם שאתה מביא ${item}!`);
}

/** Ask if anyone can bring a specific item — broadcasts "מישהו יכול להביא X?" to all. */
async function handleAsk(fromChatId: string, item: string) {
  const admin = getAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("telegram_chat_id", fromChatId)
    .maybeSingle();

  const name = (profile?.display_name as string | null) ?? "מישהו";
  const broadcastText = `❓ ${name} שואל: מישהו יכול להביא ${item} לבריכה?`;

  const { data: others } = await admin
    .from("profiles")
    .select("telegram_chat_id")
    .not("telegram_chat_id", "is", null)
    .neq("telegram_chat_id", fromChatId);

  const recipients = (others ?? []).map((p) => p.telegram_chat_id as string);
  await Promise.allSettled(recipients.map((id) => sendMessage(id, broadcastText)));
  await sendMessage(fromChatId, `✅ שלחנו לכולם שאתה מחפש מי שמביא ${item}`);
}

/** Inline keyboard for /rate — pool load options. */
function buildRateKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🏖️ ריק", callback_data: "rate:level:🏖️ ריק" },
        { text: "🏊 רגיל", callback_data: "rate:level:🏊 רגיל" },
      ],
      [
        { text: "🌊 עמוס", callback_data: "rate:level:🌊 עמוס" },
        { text: "🚫 מלא", callback_data: "rate:level:🚫 מלא" },
      ],
    ],
  };
}

/** Check user into pool via Telegram (bypasses cookie auth, uses admin client). */
async function handleTelegramCheckin(fromChatId: string) {
  const admin = getAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, display_name, avatar_url, telegram_chat_id")
    .eq("telegram_chat_id", fromChatId)
    .maybeSingle();

  if (!profile) {
    await sendMessage(fromChatId, "לא מצאתי את הפרופיל שלך. התחבר לאפליקציה תחילה.");
    return;
  }

  const name = (profile.display_name as string | null) ?? "שחיין";
  const avatarUrl = (profile.avatar_url as string | null) ?? null;
  const now = new Date().toISOString();
  const visitDate = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });

  // Upsert pool_presence
  await admin.from("pool_presence").upsert(
    { user_id: profile.id, display_name: name, avatar_url: avatarUrl, checked_in_at: now },
    { onConflict: "user_id" }
  );

  // Upsert pool_visits for today
  await admin.from("pool_visits").upsert(
    { user_id: profile.id, visit_date: visitDate, checked_in_at: now },
    { onConflict: "user_id,visit_date", ignoreDuplicates: false }
  );

  // Notify group members / all users
  const { data: memberRows } = await admin.from("pool_group_members").select("group_id").eq("user_id", profile.id);
  const groupIds = (memberRows ?? []).map((r) => r.group_id as string);
  let chatIds: string[] = [];

  if (groupIds.length > 0) {
    const { data: groupMembers } = await admin.from("pool_group_members").select("user_id").in("group_id", groupIds).neq("user_id", profile.id);
    const recipientIds = [...new Set((groupMembers ?? []).map((r) => r.user_id as string))];
    const { data: groupProfiles } = await admin.from("profiles").select("telegram_chat_id").in("id", recipientIds).not("telegram_chat_id", "is", null);
    chatIds = (groupProfiles ?? []).map((p) => p.telegram_chat_id as string);
  } else {
    const { data: allProfiles } = await admin.from("profiles").select("telegram_chat_id").neq("id", profile.id).not("telegram_chat_id", "is", null);
    chatIds = (allProfiles ?? []).map((p) => p.telegram_chat_id as string);
  }

  if (chatIds.length > 0) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    await Promise.allSettled(chatIds.map((id) =>
      sendMessage(id, `🏊 ${name} נכנס לבריכה! בוא תצטרף 🌊`, {
        inline_keyboard: [[{ text: "פתח אפליקציה", url: appUrl }]],
      })
    ));
  }

  await sendMessage(fromChatId, "✅ נרשמת בבריכה! חברים שלך קיבלו התראה. 🏊");
}

/** Check user out of pool via Telegram. */
async function handleTelegramCheckout(fromChatId: string) {
  const admin = getAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, display_name")
    .eq("telegram_chat_id", fromChatId)
    .maybeSingle();

  if (!profile) {
    await sendMessage(fromChatId, "לא מצאתי את הפרופיל שלך.");
    return;
  }

  const { data: presence } = await admin
    .from("pool_presence")
    .select("checked_in_at")
    .eq("user_id", profile.id)
    .maybeSingle();

  await admin.from("pool_presence").delete().eq("user_id", profile.id);

  if (presence?.checked_in_at) {
    const durationMinutes = Math.round((Date.now() - new Date(presence.checked_in_at).getTime()) / 60_000);
    const visitDate = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
    await admin.from("pool_visits").update({ duration_minutes: durationMinutes }).eq("user_id", profile.id).eq("visit_date", visitDate);
    await sendMessage(fromChatId, `👋 יצאת מהבריכה! ביקרת ${durationMinutes} דקות היום. עד הפעם הבאה 🌞`);
  } else {
    await sendMessage(fromChatId, "👋 יצאת! (לא נמצאת כרשום בבריכה)");
  }
}

/** Handle photo sent to the bot — upload to Supabase Storage. */
async function handlePhoto(fromChatId: string, photos: { file_id: string; file_size?: number }[]) {
  const admin = getAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, display_name")
    .eq("telegram_chat_id", fromChatId)
    .maybeSingle();

  if (!profile) {
    await sendMessage(fromChatId, "לא מצאתי את הפרופיל שלך. התחבר לאפליקציה תחילה.");
    return;
  }

  // Pick the largest photo variant
  const best = photos.reduce((a, b) => ((a.file_size ?? 0) >= (b.file_size ?? 0) ? a : b));
  const token = process.env.TELEGRAM_BOT_TOKEN;

  try {
    // Get file path from Telegram
    const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${best.file_id}`);
    const fileData = await fileRes.json();
    const filePath: string = fileData.result?.file_path;
    if (!filePath) throw new Error("No file path");

    // Download file
    const imgRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
    const imgBuffer = await imgRes.arrayBuffer();

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const storagePath = `telegram/${profile.id}/${timestamp}.jpg`;
    const { error: uploadError } = await admin.storage
      .from("pool-photos")
      .upload(storagePath, imgBuffer, { contentType: "image/jpeg", upsert: false });

    if (uploadError) throw uploadError;

    await sendMessage(fromChatId, "📸 התמונה נשמרה לגלריה! תודה שחלקת עם הבריכה 🌊");
  } catch (err) {
    console.error("[telegram] photo upload error", err);
    await sendMessage(fromChatId, "⚠️ לא הצלחנו לשמור את התמונה. נסה שוב.");
  }
}

/** Broadcast a pool load rating to all users. */
async function handleRating(fromChatId: string, level: string) {
  const admin = getAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("telegram_chat_id", fromChatId)
    .maybeSingle();

  const name = (profile?.display_name as string | null) ?? "מישהו";
  const broadcastText = `⭐ ${name} מדרג עומס הבריכה: ${level}`;

  const { data: others } = await admin
    .from("profiles")
    .select("telegram_chat_id")
    .not("telegram_chat_id", "is", null)
    .neq("telegram_chat_id", fromChatId);

  const recipients = (others ?? []).map((p) => p.telegram_chat_id as string);
  await Promise.allSettled(recipients.map((id) => sendMessage(id, broadcastText)));
  await sendMessage(fromChatId, `✅ שלחנו לכולם את הדירוג: ${level}`);
}

/** Broadcast "I'm arriving at X:00" to all other users. */
async function handleLater(fromChatId: string, hour: number) {
  const admin = getAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("telegram_chat_id", fromChatId)
    .maybeSingle();

  const name = (profile?.display_name as string | null) ?? "מישהו";
  const broadcastText = `🕐 ${name} מגיע לבריכה בשעה ${hour}:00!`;

  const { data: others } = await admin
    .from("profiles")
    .select("telegram_chat_id")
    .not("telegram_chat_id", "is", null)
    .neq("telegram_chat_id", fromChatId);

  const recipients = (others ?? []).map((p) => p.telegram_chat_id as string);
  await Promise.allSettled(recipients.map((id) => sendMessage(id, broadcastText)));
  await sendMessage(fromChatId, `✅ עדכנו את כולם שאתה מגיע בשעה ${hour}:00`);
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
    } else if (data.startsWith("bring:item:")) {
      const item = data.slice("bring:item:".length);
      await handleBring(chatId, item);
    } else if (data.startsWith("ask:item:")) {
      const item = data.slice("ask:item:".length);
      await handleAsk(chatId, item);
    } else if (data.startsWith("later:time:")) {
      const hour = parseInt(data.split(":")[2]);
      await handleLater(chatId, hour);
    } else if (data.startsWith("rate:level:")) {
      const level = data.slice("rate:level:".length);
      await handleRating(chatId, level);
    }

    return NextResponse.json({ ok: true });
  }

  // ── Regular message ───────────────────────────────────────────────────────
  const message = body?.message;
  if (!message) return NextResponse.json({ ok: true });

  const text: string = message.text ?? "";
  const chatId = String(message.chat.id);

  // Photo message — save to pool gallery
  if (message.photo) {
    await handlePhoto(chatId, message.photo);
    return NextResponse.json({ ok: true });
  }

  if (text.startsWith("/start")) {
    const token = text.slice(6).trim();

    const siteUrlBase = process.env.NEXT_PUBLIC_APP_URL!;

    if (!token) {
      await sendMessage(
        chatId,
        "ברוך הבא ל-UV Pool! 🌞🏊\n\nכאן תקבל התראות כשהשמש חזקה מספיק לבריכה.\nלחץ על הכפתור כדי להירשם ולהתחבר לאתר:",
        { inline_keyboard: [[{ text: "הירשם לאתר 🔗", url: `${siteUrlBase}/register` }]] }
      );
      return NextResponse.json({ ok: true });
    }

    const admin = getAdmin();
    const { data: row } = await admin
      .from("pending_telegram_tokens")
      .select("user_id, expires_at")
      .eq("token", token)
      .single();

    if (!row) {
      await sendMessage(
        chatId,
        "הלינק לא תקף או פג תוקפו. חזור לאתר וצור לינק חדש.",
        { inline_keyboard: [[{ text: "חזור לאתר 🔗", url: siteUrlBase }]] }
      );
      return NextResponse.json({ ok: true });
    }

    if (new Date(row.expires_at) < new Date()) {
      await admin.from("pending_telegram_tokens").delete().eq("token", token);
      await sendMessage(
        chatId,
        "הלינק פג תוקף. חזור לאתר וצור לינק חדש.",
        { inline_keyboard: [[{ text: "חזור לאתר 🔗", url: siteUrlBase }]] }
      );
      return NextResponse.json({ ok: true });
    }

    await admin.from("profiles").update({ telegram_chat_id: chatId }).eq("id", row.user_id);
    await admin.from("pending_telegram_tokens").delete().eq("token", token);

    await sendMessage(
      chatId,
      "מעולה! 🎉 נרשמת בהצלחה להתראות ה-UV.\n" +
        "מעכשיו נשלח לך התראה כשהשמש חזקה מדי — שעה לפני השיא ובשיא עצמו ☀️\n\n" +
        "חזור לאפליקציה כדי לנהל את הפרופיל שלך 👇",
      { inline_keyboard: [[{ text: "🏊 חזור לאתר", url: siteUrlBase }]] }
    );
  }

  if (text === "/checkin" || text === "נכנסתי לבריכה") {
    await handleTelegramCheckin(chatId);
  } else if (text === "/checkout" || text === "יצאתי מהבריכה") {
    await handleTelegramCheckout(chatId);
  } else if (text === "/rate") {
    await sendMessage(chatId, "איך העומס בבריכה עכשיו? 🏊", buildRateKeyboard());
  } else if (text === "/invite" || text.startsWith("/invite ")) {
    await sendMessage(chatId, "בחר תאריך לבריכה:", buildDateKeyboard());
  } else if (text === "/bring") {
    await sendMessage(chatId, "מה אתה מביא לבריכה? בחר מהרשימה או כתוב בחופשי 👇", buildBringKeyboard());
  } else if (text.startsWith("/bring ")) {
    // Free-text bring: /bring [item]
    const item = text.slice("/bring ".length).trim();
    if (item) await handleBring(chatId, item);
  } else if (text === "/ask") {
    await sendMessage(chatId, "מה אתה שואל אם מישהו מביא? בחר מהרשימה או כתוב בחופשי 👇", buildAskKeyboard());
  } else if (text.startsWith("/ask ")) {
    // Free-text ask: /ask [item]
    const item = text.slice("/ask ".length).trim();
    if (item) await handleAsk(chatId, item);
  } else if (text === "/later" || text.startsWith("/later ")) {
    await sendMessage(chatId, "באיזו שעה אתה מגיע? ⏰", buildLaterKeyboard());
  } else if (text === "/help") {
    await sendMessage(
      chatId,
      "🏊 UV Pool Bot — פקודות זמינות:\n\n" +
      "/checkin  — נכנסתי לבריכה! ✅\n" +
      "/checkout — יצאתי מהבריכה 👋\n" +
      "/rate     — דרג את עומס הבריכה ⭐\n" +
      "/invite   — זמן חברים לבריכה עם Google Calendar 📅\n" +
      "/bring    — הודע מה אתה מביא לבריכה 🎒\n" +
      "/bring [פריט] — כתוב ישירות מה אתה מביא\n" +
      "/ask      — שאל אם מישהו יכול להביא פריט ❓\n" +
      "/ask [פריט] — שאל ישירות לגבי פריט\n" +
      "/later    — הודע מתי אתה מגיע ⏰\n\n" +
      "📸 אפשר גם לשלוח תמונה ישירות לגלריית הבריכה!"
    );
  }

  return NextResponse.json({ ok: true });
}
