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
  if (sub.whatsapp && sub.callmebot_apikey) {
    await sendWhatsApp(sub.whatsapp, sub.callmebot_apikey, buildMessage(payload));
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

async function sendWhatsApp(
  phone: string,
  apikey: string,
  text: string
): Promise<void> {
  const params = new URLSearchParams({ phone, text, apikey });
  const res = await fetch(`https://api.callmebot.com/whatsapp.php?${params}`);
  if (!res.ok) throw new Error(`CallMeBot error: ${res.status}`);
}
