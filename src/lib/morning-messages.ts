const MESSAGES = [
  "מי שלא קם עד 8 — גם ה-UV לא מחכה לו.",
  "קפה זה יפה, בריכה זה יפה יותר.",
  "כל שעה שאתה מחכה, השיזוף של השכן מתקדם.",
  "המחקרים הוכיחו: אנשים שקמים בבוקר לבריכה הם פשוט טובים יותר.",
  "אם לא תלך עכשיו, תתחרט. זה לא ניחוש, זו סטטיסטיקה.",
  "שעה בבריכה שווה שלוש שעות בספרייה. מדעית.",
  "ה-UV לא מחכה לאיש. הוא עלה, הוא שורף, הוא יורד. תהיה שם.",
  "אין מזגן בעולם שמנצח מים קרירים. אמרתי.",
  "עוד יום שחמצת = עוד יום שהחיים עברו מבלי שהשתזפת.",
];

/** Rotating morning message — changes daily (same index mechanic as banner). */
export function getMorningMessage(now: Date = new Date()): string {
  const day = Math.floor(now.getTime() / 86_400_000);
  return MESSAGES[day % MESSAGES.length];
}
