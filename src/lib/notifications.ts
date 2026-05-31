import type { Subscriber } from "@/types";

interface AlertPayload {
  type: "warn" | "threshold";
  uvValue: number;
  alertTime: string;
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
  const time = new Date(payload.alertTime).toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jerusalem",
  });

  if (payload.type === "warn") {
    return `בעוד שעה (ב-${time}) קרינת ה-UV בבאר שבע תגיע ל-${payload.uvValue}. תעזוב הכל ותגיע לבריכה! 🏊`;
  }

  return `קרינת ה-UV בבאר שבע הגיעה ל-${payload.uvValue} ב-${time}. מומלץ להישאר בצל, להשתמש בקרם הגנה SPF 50+ ולחבוש כובע.`;
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
