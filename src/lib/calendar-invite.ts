/** Generate an ICS (iCalendar) file string for a pool session invite. */
export function generateICS(opts: {
  dateStr: string;   // YYYY-MM-DD
  hour: number;      // 0–23
  organizer: string; // inviter display name
}): string {
  const { dateStr, hour, organizer } = opts;

  const pad = (n: number) => String(n).padStart(2, "0");
  const ymd = dateStr.replace(/-/g, "");
  const start = `${ymd}T${pad(hour)}0000`;
  const end   = `${ymd}T${pad(Math.min(hour + 2, 23))}0000`;
  const stamp = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
  const uid   = `pool-${ymd}-${hour}@uv-index-seven.vercel.app`;

  const summary  = `בריכה 🏊 עם ${organizer}`;
  const location = "בריכת אוניברסיטת בן גוריון, באר שבע";
  const description = `${organizer} מזמין/ת לבריכה! UV גבוה ומומלץ 🌞`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//UV Pool//IL",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** Send calendar invite emails to a list of email addresses via Resend. */
export async function sendCalendarInviteEmails(opts: {
  emails: string[];
  dateStr: string;
  hour: number;
  organizer: string;
}): Promise<void> {
  const { emails, dateStr, hour, organizer } = opts;
  if (!emails.length || !process.env.RESEND_API_KEY) return;

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const ics = generateICS({ dateStr, hour, organizer });

  const dateDisplay = new Date(`${dateStr}T${String(hour).padStart(2, "0")}:00:00`)
    .toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Jerusalem" });

  await Promise.allSettled(
    emails.map((to) =>
      resend.emails.send({
        from: "UV Pool <noreply@uv-index-seven.vercel.app>",
        to,
        subject: `🏊 ${organizer} מזמין/ת לבריכה — ${dateDisplay} ${hour}:00`,
        html: `<p>${organizer} מזמין/ת אותך לבריכה ב-${dateDisplay} בשעה ${hour}:00!</p><p>הצרף/י את ה-ICS לקובץ הקלנדר שלך.</p>`,
        attachments: [
          {
            filename: "pool-invite.ics",
            content: Buffer.from(ics).toString("base64"),
          },
        ],
      })
    )
  );
}
