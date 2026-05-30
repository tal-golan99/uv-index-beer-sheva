// 20 rotating banner sentences — placeholders, content to be replaced later.
// One is shown per day, deterministically, so it stays stable across renders
// within the same day and rotates to the next on the following day.

export const BANNER_SENTENCES: string[] = [
  "מחקרים מראים ששעה בבריכה ביום מעלה את הממוצע ב-5 נקודות",
  "מים בטמפרטורה מושלמת. מה אתה עוד עושה פה?",
  "השמש זורחת, הבריכה מחכה — קדימה לבאר שבע!",
  "יום מושלם לצוף בלי לחשוב על כלום.",
  "החברים כבר במים. אתה עדיין מתלבט?",
  "אין תירוצים — חופשה מתחילה בקפיצה אחת למים.",
  "ויטמין D חינם בחוץ. נצל את זה.",
  "הקיץ קצר, הבריכה פתוחה. תעשה את החשבון.",
  "תזכורת ידידותית: גוף בתנועה במים הוא גוף מאושר.",
  "פחות מסכים, יותר מים. זה הסוד.",
  "מי שמגיע ראשון תופס את הכיסא הכי טוב בצל.",
  "הבריכה לא תבוא אליך. תבוא אתה אליה.",
  "רגע של שקט על המים שווה יותר מאלף הודעות.",
  "היום זה היום. מחר תגיד 'הייתי צריך אתמול'.",
  "שיזוף קל, צחוק גדול, מים קרירים — מתכון מנצח.",
  "אל תתנו לקיץ לעבור מהחלון.",
  "כל קפיצה למים מוחקת יום שלם של עצבים.",
  "החיים יפים יותר עם השיער רטוב.",
  "הזמן הכי טוב לבוא לבריכה היה אתמול. השני הכי טוב — עכשיו.",
  "בריכה + חברים = הנוסחה לאושר.",
  "תנשום עמוק, תקפוץ פנימה, תודה לי אחר כך.",
];

/** Day-of-year in Asia/Jerusalem, 0-based. Stable for the whole calendar day. */
function dayOfYearJerusalem(now: Date = new Date()): number {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [y, m, d] = fmt.format(now).split("-").map(Number);
  const startUTC = Date.UTC(y, 0, 1);
  const todayUTC = Date.UTC(y, m - 1, d);
  return Math.floor((todayUTC - startUTC) / 86_400_000);
}

/** The banner sentence for the given day (defaults to today, Jerusalem time). */
export function bannerForToday(now: Date = new Date()): string {
  const idx = dayOfYearJerusalem(now) % BANNER_SENTENCES.length;
  return BANNER_SENTENCES[idx];
}
