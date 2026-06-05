"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  children: React.ReactNode;
  /** Stagger the reveal by N ms. */
  delay?: number;
  /** Reveal only once (no fade-out when scrolling away). Default: bidirectional. */
  once?: boolean;
  /** Motion flavour: "up" (slide) or "scale" (settle in). Lets sections differ. */
  variant?: "up" | "scale";
  className?: string;
}

/**
 * Content is visible by default (SSR / no-JS / OG crawlers). Once JS loads,
 * off-screen elements receive `is-hidden` and animate in on scroll entry.
 * Honors prefers-reduced-motion via CSS.
 */
export default function Reveal({ children, delay = 0, once = false, variant = "up", className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHidden(false);
          setVisible(true);
          if (once) io.unobserve(entry.target);
        } else {
          setHidden(true);
          if (!once) setVisible(false);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  const cls = [
    "reveal",
    variant === "scale" ? "reveal-scale" : null,
    hidden ? "is-hidden" : visible ? "reveal-in" : null,
    className,
  ].filter(Boolean).join(" ");

  return (
    <div ref={ref} className={cls} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
