import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

interface Props {
  href?: string;
  label?: string;
}

export default function BackLink({ href = "/", label = "חזרה" }: Props) {
  return (
    <Link
      href={href}
      className="flex w-fit items-center gap-1.5 text-sm font-semibold text-[color:var(--color-ink-2)] transition-colors hover:text-[color:var(--color-pool-600)]"
    >
      {label} <ArrowRight size={18} aria-hidden />
    </Link>
  );
}
