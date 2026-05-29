import { Resend } from "resend";
import type { Subscriber } from "@/types";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

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
  const { subject, text, html } = buildMessage(payload);
  const tasks: Promise<unknown>[] = [];

  if (sub.email) {
    tasks.push(
      resend.emails.send({ from: FROM, to: sub.email, subject, html })
    );
  }

  if (sub.whatsapp && sub.callmebot_apikey) {
    tasks.push(sendWhatsApp(sub.whatsapp, sub.callmebot_apikey, text));
  }

  await Promise.allSettled(tasks);
}

function buildMessage(payload: AlertPayload): {
  subject: string;
  text: string;
  html: string;
} {
  const time = new Date(payload.alertTime).toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jerusalem",
  });

  if (payload.type === "warn") {
    const subject = `⚠️ בעוד שעה UV יגיע ל-${payload.uvValue} בבאר שבע`;
    const text = `בעוד שעה (ב-${time}) קרינת ה-UV בבאר שבע תגיע ל-${payload.uvValue}. תעזוב הכל ותגיע לבריכה! 🏊`;
    return {
      subject,
      text,
      html: `<p>${text}</p><p style="font-size:12px;color:#666">לבטל התראות — <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe">לחץ כאן</a></p>`,
    };
  }

  const subject = `🔴 UV הגיע ל-${payload.uvValue} — הגן על עצמך!`;
  const text = `קרינת ה-UV בבאר שבע הגיעה ל-${payload.uvValue} ב-${time}. מומלץ להישאר בצל, להשתמש בקרם הגנה SPF 50+ ולחבוש כובע.`;
  return {
    subject,
    text,
    html: `<p>${text}</p><p style="font-size:12px;color:#666">לבטל התראות — <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe">לחץ כאן</a></p>`,
  };
}

async function sendWhatsApp(
  phone: string,
  apikey: string,
  text: string
): Promise<void> {
  const params = new URLSearchParams({
    phone,
    text,
    apikey,
  });
  const res = await fetch(
    `https://api.callmebot.com/whatsapp.php?${params}`
  );
  if (!res.ok) throw new Error(`CallMeBot error: ${res.status}`);
}
