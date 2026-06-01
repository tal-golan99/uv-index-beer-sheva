import UVGauge from "@/components/UVGauge";
import { getUVLevel } from "@/lib/uv";

interface Props {
  uv: number;
  poolTime: boolean;
}

/** The day's answer in one line, by UV strength. Irreverent but written, not emoji. */
function verdictFor(uv: number): { answer: string; sub: string; emoji?: string } {
  if (uv >= 9)
    return {
      answer: "מהר לבריכה!",
      sub: `ה-UV על ${uv.toFixed(0)}. שמש מושלמת לצוף, אל תבזבז אותה.`,
      emoji: "🏊",
    };
  if (uv >= 7)
    return {
      answer: "כן, בהחלט.",
      sub: `UV ${uv.toFixed(0)} — חזק ונעים בדיוק כמו שצריך. כובע, מים, וקדימה.`,
    };
  if (uv >= 4)
    return {
      answer: "אפשר, בלי להגזים.",
      sub: `UV ${uv.toFixed(0)}. השמש גבוהה אבל לא מספיק — בריכה אף פעם לא רעיון רע.`,
    };
  return {
    answer: "עוד לא.",
    sub: `UV ${uv.toFixed(0)}. חלש מדי בשביל שיזוף. שב בצל, נתעדכן כשהשמש מתעוררת.`,
  };
}

/**
 * The home hero: the single elevated card on the page. Answers the one question the
 * app exists for ("should I go to the pool now?") in a big Suez line, with the UV
 * gauge alongside as the evidence. Replaces the old standalone gauge card + PoolTimeHero.
 */
export default function PoolVerdict({ uv, poolTime }: Props) {
  const { answer, sub, emoji } = verdictFor(uv);
  const level = getUVLevel(uv);

  return (
    <div className="anim-pop radius-card shadow-pool-lg relative overflow-hidden bg-white ring-1 ring-[color:var(--color-pool-100)]">
      {poolTime && (
        <div
          className="anim-sun pointer-events-none absolute -top-16 -left-16 h-56 w-56 rounded-full opacity-60"
          style={{ background: "radial-gradient(circle, var(--color-sun-300) 0%, rgba(255,217,94,0) 70%)" }}
          aria-hidden
        />
      )}

      <div className="relative grid items-center gap-6 p-6 md:grid-cols-[1.05fr_0.95fr] md:gap-8 md:p-9">
        {/* The answer */}
        <div className="text-center md:text-right">
          <p className="text-sm font-bold text-[color:var(--color-ink-2)] md:text-base">
            כדאי לבריכה עכשיו?
          </p>
          <h1
            className="display-title mt-2 text-[color:var(--color-pool-700)]"
            style={{ fontSize: "clamp(2.5rem, 11vw, 4.75rem)" }}
          >
            <span className="title-underline">{answer}</span>
          </h1>
          <p className="prose-pretty mx-auto mt-4 max-w-sm text-base font-semibold text-[color:var(--color-ink-2)] md:mx-0 md:text-lg">
            {sub}
            {emoji && <span aria-hidden> {emoji}</span>}
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold text-white"
             style={{ backgroundColor: level.colorText }}>
            רמת שמש: {level.label}
          </p>
        </div>

        {/* The evidence */}
        <div className="mx-auto w-full max-w-xs md:max-w-none">
          <UVGauge value={uv} />
        </div>
      </div>
    </div>
  );
}
