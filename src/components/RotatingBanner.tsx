interface Props {
  /** Sentence chosen server-side (see lib/banner.ts) to avoid hydration drift. */
  sentence: string;
}

/**
 * Top-of-page summery ticker. The sentence rotates once per day; this component
 * just renders the one chosen for today with a gentle entrance animation.
 */
export default function RotatingBanner({ sentence }: Props) {
  return (
    <div
      className="anim-rise relative overflow-hidden rounded-full px-5 py-2.5 flex items-center justify-center gap-2 text-center"
      style={{
        background: "linear-gradient(90deg, var(--color-sun-300), var(--color-sun-400))",
        boxShadow: "0 8px 24px -8px rgba(234,179,8,0.6)",
      }}
    >
      <span className="anim-sun text-lg leading-none shrink-0" aria-hidden>
        ☀️
      </span>
      <p className="text-sm font-semibold text-[color:var(--color-ink)] leading-snug">
        {sentence}
      </p>
    </div>
  );
}
