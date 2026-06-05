import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { COLORS } from "../constants";
import { assistantFont, suezOneFont } from "../fonts";

export default function Scene5CTA() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo springs in
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 180 },
    from: 0.7,
    to: 1,
  });

  // Tagline rises
  const tagOpacity = interpolate(frame, [12, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tagY = interpolate(frame, [12, 34], [28, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // CTA button springs in
  const btnScale = spring({
    frame: frame - 28,
    fps,
    config: { damping: 12, stiffness: 220 },
    from: 0,
    to: 1,
  });

  // URL fades in last
  const urlOpacity = interpolate(frame, [42, 56], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${COLORS.poolBlue} 0%, ${COLORS.poolBlueDark} 100%)`,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 52,
      }}
    >
      {/* Decorative radial glow */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 65%)`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />

      {/* Logo: sun icon + wordmark */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          display: "flex",
          alignItems: "center",
          gap: 28,
          direction: "ltr",
        }}
      >
        <svg width={110} height={110} viewBox="0 0 100 100">
          <circle cx={50} cy={50} r={24} fill={COLORS.sunGold} />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * 45 * Math.PI) / 180;
            return (
              <line
                key={i}
                x1={50 + 32 * Math.cos(a)}
                y1={50 + 32 * Math.sin(a)}
                x2={50 + 45 * Math.cos(a)}
                y2={50 + 45 * Math.sin(a)}
                stroke={COLORS.sunGold}
                strokeWidth={5}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        <span
          style={{
            fontFamily: `${suezOneFont}, sans-serif`,
            fontSize: 110,
            color: "white",
            fontWeight: 400,
            letterSpacing: -3,
          }}
        >
          UV Pool
        </span>
      </div>

      {/* Hebrew tagline */}
      <div
        style={{
          opacity: tagOpacity,
          transform: `translateY(${tagY}px)`,
          fontFamily: `${assistantFont}, sans-serif`,
          fontSize: 52,
          color: "rgba(255,255,255,0.85)",
          textAlign: "center",
          maxWidth: 860,
          direction: "rtl",
          lineHeight: 1.5,
          fontWeight: 600,
        }}
      >
        מדד UV בזמן אמת{"\n"}
        ומי בבריכה עכשיו · באר שבע
      </div>

      {/* CTA button */}
      <div
        style={{
          transform: `scale(${Math.max(btnScale, 0)})`,
          backgroundColor: COLORS.sunGold,
          borderRadius: 999,
          padding: "32px 100px",
          boxShadow: `0 20px 52px -14px ${COLORS.sunGold}88`,
        }}
      >
        <span
          style={{
            fontFamily: `${assistantFont}, sans-serif`,
            fontSize: 60,
            fontWeight: 800,
            color: COLORS.darkInk,
            direction: "rtl",
          }}
        >
          הורד עכשיו בחינם
        </span>
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: urlOpacity,
          fontFamily: `${assistantFont}, sans-serif`,
          fontSize: 48,
          fontWeight: 800,
          color: "rgba(255,255,255,0.9)",
          direction: "rtl",
        }}
      >
        אל תהיה לוזר
      </div>

      {/* URL */}
      <div
        style={{
          opacity: urlOpacity,
          fontFamily: `${assistantFont}, sans-serif`,
          fontSize: 40,
          color: "rgba(255,255,255,0.55)",
          letterSpacing: 2,
          direction: "ltr",
        }}
      >
        uvpool.app
      </div>
    </AbsoluteFill>
  );
}
