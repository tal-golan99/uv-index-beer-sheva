"use client";

import { useEffect } from "react";

/**
 * Toggles body classes for theme variants:
 * - `pool-time`: UV >= 9 (warm honey gradient)
 * - `night-mode`: after sunset / before sunrise in Israel
 */
export default function BodyTheme({ poolTime, nightMode }: { poolTime: boolean; nightMode: boolean }) {
  useEffect(() => {
    document.body.classList.toggle("pool-time", poolTime);
    document.body.classList.toggle("night-mode", nightMode);
    return () => {
      document.body.classList.remove("pool-time");
      document.body.classList.remove("night-mode");
    };
  }, [poolTime, nightMode]);

  return null;
}
