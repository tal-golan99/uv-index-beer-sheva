"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  children: React.ReactNode;
  /** Stagger the reveal by N ms. */
  delay?: number;
  /** Reveal only once (no fade-out when scrolling away). Default: bidirectional. */
  once?: boolean;
  className?: string;
}

/**
 * Fades + slides its children in as they enter the viewport, and back out when
 * they leave (unless `once`). Driven by IntersectionObserver — the standard,
 * performant approach for scroll-reveal. Honors prefers-reduced-motion via CSS.
 */
export default function Reveal({ children, delay = 0, once = false, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) io.unobserve(entry.target);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "reveal-in" : ""}${className ? ` ${className}` : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
