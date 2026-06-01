// Rotating daily one-liners. One is shown per day, deterministically, so it stays
// stable across renders within the same day and rotates to the next on the following
// day. Voice: irreverent, local, self-deprecating. Written jokes, not emoji filler.

export const BANNER_SENTENCES: string[] = [
  "באר שבע, ארבעים מעלות, והבריכה חצי ריקה. תתביישו.",
  "הידעת שמחקרים מראים ששעת בריכה אחת ביום מעלה את הממוצע בתואר ב-10 נקודות?",
  "השמש כבר בעבודה. גם אתה אמור להיות.",
  "מי שלא בא היום, מסביר מחר למה לא בא.",
  "שום מזגן לא מנצח קפיצה ראשונה למים.",
  "החברים כבר במים, ואתה קורא משפטים באפליקציה.",
  "ויטמין D לא יקנה את עצמו. צא החוצה.",
  "הבריכה פתוחה. התירוצים סגורים.",
  "כל יום בבית הוא עוד יום שהשיזוף של השכן מנצח אותך.",
  "מים קרירים, ראש שקט. זה כל הסיפור.",
  "בקיץ של באר שבע יש שתי אופציות: צל או בריכה. בחרת נכון.",
  "הכי טוב היה אתמול. השני הכי טוב זה ממש עכשיו.",
  "תכל'ס, יש לך משהו טוב יותר לעשות מבריכה?",
  "קפיצה אחת למים מוחקת בוקר שלם של עצבים.",
  "מי שמגיע ראשון תופס את הכיסא הטוב בצל. תזדרז.",
  "פחות מסכים, יותר מים. ההמלצה היחידה שתקבל מאיתנו.",
  "השיער יתייבש עד הערב. הגאווה שנשארה בבית לא.",
  "הקיץ קצר, והבריכה לא מחכה לאף אחד.",
  "באת, קפצת, נרגעת. אין על זה.",
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
