import Image from "next/image";
import Link from "next/link";

export default function MoreUVButton() {
  return (
    <Link
      href="/more"
      aria-label="More UV — מנוי פרמיום"
      className="flex items-center gap-2 rounded-full bg-[color:var(--color-pool-50)] px-3 py-1.5 text-sm font-bold text-[color:var(--color-pool-700)] ring-1 ring-[color:var(--color-pool-200)] hover:ring-[color:var(--color-pool-400)] active:scale-95 transition-all shrink-0"
    >
      <div className="relative h-6 w-6 rounded-full overflow-hidden shrink-0 ring-1 ring-[color:var(--color-pool-200)]">
        <Image
          src="/more/IMG_9931.JPG"
          alt=""
          fill
          sizes="24px"
          className="object-cover"
        />
      </div>
      <span className="whitespace-nowrap">More UV</span>
    </Link>
  );
}
