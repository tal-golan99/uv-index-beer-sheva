"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { Photo } from "@/lib/photos";

interface Props {
  photos: Photo[];
  /** CSS aspect-ratio, e.g. "16 / 9". Ignored when `heightClass` is set. */
  aspect?: string;
  /** Tailwind height utilities (e.g. "h-[80vh]"); overrides `aspect` when set. */
  heightClass?: string;
  /** Auto-advance interval in ms (0 disables). */
  interval?: number;
  rounded?: string;
  /** Optional content rendered on top of the slider (e.g. a hero title). */
  children?: React.ReactNode;
}

/**
 * Lightweight auto-advancing photo carousel. Uses native <img>, so EXIF
 * orientation from the phone photos is respected (CSS backgrounds would not be).
 */
export default function ImageSlider({
  photos,
  aspect = "16 / 10",
  heightClass,
  interval = 4500,
  rounded = "rounded-3xl",
  children,
}: Props) {
  const [i, setI] = useState(0);
  const n = photos.length;

  const go = useCallback((d: number) => setI((p) => (p + d + n) % n), [n]);

  useEffect(() => {
    if (!interval || n <= 1) return;
    const id = setInterval(() => setI((p) => (p + 1) % n), interval);
    return () => clearInterval(id);
  }, [interval, n]);

  return (
    <div
      className={`relative w-full overflow-hidden ${rounded} ${heightClass ?? ""} ring-1 ring-[color:var(--color-pool-200)] shadow-md`}
      style={heightClass ? undefined : { aspectRatio: aspect }}
    >
      {photos.map((p, idx) => (
        <Image
          key={p.src}
          src={p.src}
          alt={p.alt}
          fill
          priority={idx === 0}
          sizes="(min-width: 768px) 640px, 100vw"
          className="object-cover transition-opacity duration-700"
          style={{ opacity: idx === i ? 1 : 0 }}
        />
      ))}

      {/* gentle bottom gradient for legibility */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

      {children && <div className="absolute inset-0">{children}</div>}

      {/* arrows */}
      {n > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="הקודם"
            className="absolute top-1/2 right-2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-[color:var(--color-ink)] backdrop-blur transition-transform hover:scale-110 active:scale-95"
          >
            ›
          </button>
          <button
            onClick={() => go(1)}
            aria-label="הבא"
            className="absolute top-1/2 left-2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-[color:var(--color-ink)] backdrop-blur transition-transform hover:scale-110 active:scale-95"
          >
            ‹
          </button>

          {/* dots */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {photos.map((p, idx) => (
              <button
                key={p.src}
                onClick={() => setI(idx)}
                aria-label={`תמונה ${idx + 1}`}
                className="h-2 rounded-full transition-all"
                style={{
                  width: idx === i ? 18 : 8,
                  background: idx === i ? "#fff" : "rgba(255,255,255,0.55)",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
