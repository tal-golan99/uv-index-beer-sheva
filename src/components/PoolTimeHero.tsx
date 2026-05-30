interface Props {
  /** Current UV value, used in the sub-line. */
  uv: number;
}

/**
 * Giant celebratory hero shown only when UV >= 9 ("pool time").
 * Pairs with the `pool-time` class on <body> set in page.tsx.
 */
export default function PoolTimeHero({ uv }: Props) {
  return (
    <div className="anim-pop relative flex flex-col items-center text-center py-6 select-none">
      <span className="anim-sun text-5xl mb-2" aria-hidden>
        🌞
      </span>
      <h1
        className="shimmer-text font-black leading-[0.95] tracking-tight"
        style={{ fontSize: "clamp(3rem, 16vw, 7rem)" }}
      >
        מהר לבריכה!
      </h1>
      <p className="mt-3 text-base sm:text-lg font-semibold text-[color:var(--color-pool-700)]">
        ה-UV הגיע ל-{uv.toFixed(0)} — שמש מושלמת, אל תבזבזו אותה 🏊
      </p>
    </div>
  );
}
