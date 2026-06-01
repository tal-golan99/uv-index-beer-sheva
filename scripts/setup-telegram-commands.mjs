/**
 * One-time script to register all bot commands in the Telegram menu.
 * Run with: TELEGRAM_BOT_TOKEN=<token> node scripts/setup-telegram-commands.mjs
 */

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  console.error("Error: TELEGRAM_BOT_TOKEN env var is required");
  process.exit(1);
}

const commands = [
  { command: "checkin",  description: "נכנסתי לבריכה! ✅" },
  { command: "checkout", description: "יצאתי מהבריכה 👋" },
  { command: "rate",     description: "דרג את עומס הבריכה ⭐" },
  { command: "invite",   description: "זמן חברים לבריכה עם Google Calendar 📅" },
  { command: "bring",    description: "הודע מה אתה מביא לבריכה 🎒" },
  { command: "ask",      description: "שאל אם מישהו יכול להביא פריט ❓" },
  { command: "later",    description: "הודע מתי אתה מגיע ⏰" },
];

const res = await fetch(`https://api.telegram.org/bot${TOKEN}/setMyCommands`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ commands }),
});

const data = await res.json();
if (data.ok) {
  console.log("✅ Commands registered successfully:");
  commands.forEach((c) => console.log(`  /${c.command} — ${c.description}`));
} else {
  console.error("❌ Failed:", data.description);
  process.exit(1);
}
