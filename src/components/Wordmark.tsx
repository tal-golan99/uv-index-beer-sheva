import { Sun } from "@phosphor-icons/react/dist/ssr";

interface Props {
  /** Visual size. sm = nav/footer, md = auth headers, lg = landing footer hero. */
  size?: "sm" | "md" | "lg";
  /** Show the "באר שבע" location chip after the name. */
  city?: boolean;
  className?: string;
}

const SIZES = {
  sm: { icon: 22, text: "text-lg", chip: "text-[11px] px-2 py-0.5" },
  md: { icon: 28, text: "text-xl", chip: "text-xs px-2 py-0.5" },
  lg: { icon: 34, text: "text-2xl", chip: "text-sm px-2.5 py-0.5" },
} as const;

/**
 * The one canonical UV Pool lockup: sun mark + "UV Pool" + optional Beer Sheva chip.
 * Reused in nav, footer, and auth headers so the brand never drifts into ad-hoc logos.
 * "UV Pool" is Latin, so the name is forced LTR inside the RTL document.
 */
export default function Wordmark({ size = "sm", city = false, className }: Props) {
  const s = SIZES[size];
  return (
    <span className={`inline-flex items-center gap-2${className ? ` ${className}` : ""}`}>
      <Sun weight="fill" size={s.icon} color="var(--color-sun-400)" aria-hidden />
      <span dir="ltr" className={`font-black tracking-tight text-[color:var(--color-ink)] ${s.text}`}>
        UV&nbsp;Pool
      </span>
      {city && (
        <span
          className={`rounded-full bg-[color:var(--color-pool-500)] font-bold text-white ${s.chip}`}
        >
          באר שבע
        </span>
      )}
    </span>
  );
}
