import Image from "next/image";
import Link from "next/link";

export default function MoreUVButton() {
  return (
    <Link
      href="/more"
      aria-label="More UV — מנוי פרמיום"
      className="flex items-center gap-2 rounded-full px-3 py-1.5 text-white font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all shrink-0"
      style={{ background: "linear-gradient(90deg, var(--color-pool-600), #f7bd24)" }}
    >
      <div className="relative h-7 w-7 rounded-full overflow-hidden shrink-0 ring-2 ring-white/40">
        <Image
          src="/more/IMG_9931.JPG"
          alt=""
          fill
          sizes="28px"
          className="object-cover"
        />
      </div>
      <span className="whitespace-nowrap">More UV ✨</span>
    </Link>
  );
}
