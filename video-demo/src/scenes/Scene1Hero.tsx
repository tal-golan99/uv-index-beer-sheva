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

export default function Scene1Hero() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Sun: spring scale in + rotation
  const sunScale = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 200 },
    from: 0,
    to: 1,
  });
  const sunRotation = interpolate(frame, [0, 45], [0, 360], {
    extrapolateRight: "clamp",
  });

  // "UV Pool" title
  const titleOpacity = interpolate(frame, [18, 38], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [18, 38], [32, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Tagline
  const tagOpacity = interpolate(frame, [34, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tagY = interpolate(frame, [34, 55], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Headline above sun
  const headlineOpacity = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headlineY = interpolate(frame, [0, 22], [-28, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pill chip
  const chipScale = spring({
    frame: frame - 48,
    fps,
    config: { damping: 14, stiffness: 220 },
    from: 0,
    to: 1,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.darkInk,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 40,
      }}
    >
      {/* Subtle radial glow behind sun */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.sunGold}22 0%, transparent 70%)`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -62%)",
        }}
      />

      {/* Headline above sun */}
      <div
        style={{
          opacity: headlineOpacity,
          transform: `translateY(${headlineY}px)`,
          fontFamily: `${assistantFont}, sans-serif`,
          fontSize: 54,
          fontWeight: 800,
          color: "white",
          textAlign: "center",
          direction: "rtl",
          lineHeight: 1.35,
          maxWidth: 860,
        }}
      >
        האפליקציה היחידה{"\n"}שתצטרכו לקיץ הקרוב
      </div>

      {/* Sun SVG icon */}
      <div
        style={{
          transform: `scale(${Math.max(sunScale, 0)}) rotate(${sunRotation}deg)`,
          transformOrigin: "center",
        }}
      >
        <svg width={160} height={160} viewBox="0 0 100 100">
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
      </div>

      {/* UV Pool wordmark */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontFamily: `${suezOneFont}, sans-serif`,
          fontSize: 112,
          color: "white",
          fontWeight: 400,
          letterSpacing: -3,
          direction: "ltr",
        }}
      >
        UV Pool
      </div>

      {/* Hebrew tagline */}
      <div
        style={{
          opacity: tagOpacity,
          transform: `translateY(${tagY}px)`,
          fontFamily: `${assistantFont}, sans-serif`,
          fontSize: 50,
          color: "#94b8cc",
          fontWeight: 600,
          textAlign: "center",
          maxWidth: 820,
          direction: "rtl",
          lineHeight: 1.4,
        }}
      >
        מדד UV בזמן אמת · באר שבע
      </div>

      {/* Call-to-question chip */}
      <div
        style={{
          transform: `scale(${Math.max(chipScale, 0)})`,
          background: `linear-gradient(135deg, ${COLORS.poolBlue}, ${COLORS.poolBlueDark})`,
          borderRadius: 999,
          padding: "22px 60px",
          boxShadow: `0 16px 40px -10px ${COLORS.poolBlue}88`,
        }}
      >
        <span
          style={{
            fontFamily: `${assistantFont}, sans-serif`,
            fontSize: 52,
            fontWeight: 800,
            color: "white",
            direction: "rtl",
          }}
        >
          לקפוץ למים
        </span>
      </div>
    </AbsoluteFill>
  );
}
