import Image from "next/image";
import Link from "next/link";

export default function MoreUVButton() {
  return (
    <Link
      href="/more"
      title="More UV ✨"
      aria-label="More UV — מנוי פרמיום"
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full overflow-hidden ring-2 ring-[color:var(--color-sun-300)] hover:ring-[color:var(--color-sun-400)] transition-all shadow-sm"
    >
      <Image
        src="/more/IMG_9931.JPG"
        alt="More UV"
        fill
        sizes="36px"
        className="object-cover"
      />
    </Link>
  );
}
