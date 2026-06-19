import type { Subscriber } from "@/types";

interface AlertPayload {
  type: "warn" | "threshold";
  uvValue: number;
  alertTime: string;
  thresholdTime?: string;
}

export async function notifySubscribers(
  subscribers: Subscriber[],
  payload: AlertPayload
): Promise<void> {
  await Promise.allSettled(
    subscribers.map((s) => notifyOne(s, payload))
  );
}

async function notifyOne(sub: Subscriber, payload: AlertPayload) {
  if (sub.telegram_chat_id) {
    await sendTelegram(sub.telegram_chat_id, buildMessage(payload));
  }
}

function buildMessage(payload: AlertPayload): string {
  const displayTime = payload.type === "warn" && payload.thresholdTime
    ? payload.thresholdTime
    : payload.alertTime;
  const time = new Date(displayTime).toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jerusalem",
  });

  if (payload.type === "warn") {
    return `בעוד שעה (ב-${time}) קרינת ה-UV בבאר שבע תגיע ל-${payload.uvValue}. תעזוב הכל ותגיע לבריכה! 🏊`;
  }

  return `האינדקס בשיא!, אם היה תירוץ מושלם להכחיש את הלימודים זה עכשיו`;
}

export async function notifyPoolEntry(
  entrantName: string,
  chatIds: string[]
): Promise<void> {
  const text = `${entrantName} נכנס לבריכה, מה אתה עדיין לומד? תחליף זריז לבגד ים ותצטרף 🏊`;
  await Promise.allSettled(chatIds.map((id) => sendTelegram(id, text)));
}

export async function notifyCheckinSelf(
  chatId: string,
  othersCount: number
): Promise<void> {
  const text =
    othersCount > 0
      ? `נכנסת לבריכה! ☀️ יש ${othersCount} חברים בפנים עכשיו 🏊`
      : `נכנסת לבריכה! ☀️ אתה ראשון בפנים 🏊`;
  await sendTelegram(chatId, text);
}

export async function notifyMorningForecast(
  chatIds: string[],
  opts: {
    poolFrom: number | null;
    poolTo: number | null;
    peakHour: number | null;
    peakUV: number | null;
    funnyLine: string;
    chartUrl: string;
    inviteButtonUrl: string;
  }
): Promise<void> {
  const poolLine = opts.poolFrom !== null && opts.poolTo !== null
    ? `🏊 זמן בריכה: ${opts.poolFrom}:00–${opts.poolTo}:00`
    : "";

  const peakLine = opts.peakHour !== null && opts.peakUV !== null
    ? `⚡ שיא: ${opts.peakHour}:00 עם UV ${opts.peakUV}`
    : "";

  const caption = [
    "☀️ בוקר טוב לכל השזופים והשזופות ☀️",
    "",
    poolLine,
    peakLine,
    "",
    opts.funnyLine,
  ].filter(Boolean).join("\n");

  const inlineKeyboard = opts.inviteButtonUrl
    ? { inline_keyboard: [[{ text: "זמן חברים לבריכה 📅", url: opts.inviteButtonUrl }]] }
    : undefined;

  await Promise.allSettled(
    chatIds.map((id) => sendTelegramPhoto(id, opts.chartUrl, caption, inlineKeyboard))
  );
}

async function sendTelegramPhoto(
  chatId: string,
  photoUrl: string,
  caption: string,
  replyMarkup?: object
): Promise<void> {
  const isLocalUrl = !photoUrl || photoUrl.includes("localhost") || photoUrl.includes("127.0.0.1");

  if (!isLocalUrl) {
    const body: Record<string, unknown> = { chat_id: chatId, photo: photoUrl, caption };
    if (replyMarkup) body.reply_markup = replyMarkup;
    const res = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
    if (res.ok) return;
    const detail = await res.text().catch(() => "");
    console.error(`[sendTelegramPhoto] Telegram error ${res.status} for chat ${chatId}:`, detail);
  }

  // Text-only fallback
  const textBody: Record<string, unknown> = { chat_id: chatId, text: caption };
  if (replyMarkup) textBody.reply_markup = replyMarkup;
  const textRes = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(textBody) }
  );
  if (!textRes.ok) {
    const detail = await textRes.text().catch(() => "");
    console.error(`[sendTelegramPhoto] text fallback failed ${textRes.status} for chat ${chatId}:`, detail);
  }
}

export async function broadcastText(chatIds: string[], text: string): Promise<void> {
  await Promise.allSettled(chatIds.map((id) => sendTelegram(id, text)));
}

async function sendTelegram(chatId: string, text: string): Promise<void> {
  const res = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    }
  );
  if (!res.ok) throw new Error(`Telegram error: ${res.status}`);
}
