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
        className="display-title font-black text-[color:var(--color-pool-700)]"
        style={{ fontSize: "clamp(3rem, 15vw, 6rem)" }}
      >
        <span className="title-underline">מהר לבריכה!</span>
      </h1>
      <p className="prose-pretty mt-5 text-base sm:text-lg font-semibold text-[color:var(--color-pool-700)]">
        ה-UV הגיע ל-{uv.toFixed(0)} — שמש מושלמת, אל תבזבזו אותה 🏊
      </p>
    </div>
  );
}
