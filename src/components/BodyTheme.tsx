"use client";

import { useEffect } from "react";

/**
 * Toggles the `pool-time` class on <body> (UV >= 9 festive theme).
 * Lives as a tiny client component because the page itself is a Server Component
 * and the themed background gradient is defined on <body> in globals.css.
 */
export default function BodyTheme({ poolTime }: { poolTime: boolean }) {
  useEffect(() => {
    document.body.classList.toggle("pool-time", poolTime);
    return () => document.body.classList.remove("pool-time");
  }, [poolTime]);

  return null;
}
