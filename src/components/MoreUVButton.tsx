import Image from "next/image";
import Link from "next/link";

export default function MoreUVButton() {
  return (
    <Link
      href="/more"
      title="More UV ✨"
      aria-label="More UV — מנוי פרמיום"
      className="flex flex-col items-center gap-0.5 transition-opacity hover:opacity-80"
    >
      <div className="relative h-9 w-9 shrink-0 rounded-full overflow-hidden ring-2 ring-[color:var(--color-sun-300)] hover:ring-[color:var(--color-sun-400)] transition-all shadow-sm">
        <Image
          src="/more/IMG_9931.JPG"
          alt="More UV"
          fill
          sizes="36px"
          className="object-cover"
        />
      </div>
      <span className="text-[9px] font-black text-[color:var(--color-pool-600)] leading-none tracking-tight">
        More UV
      </span>
    </Link>
  );
}
