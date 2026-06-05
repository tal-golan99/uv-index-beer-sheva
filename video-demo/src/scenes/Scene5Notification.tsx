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

export default function Scene5Notification() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background and heading fade in
  const headingOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headingY = interpolate(frame, [0, 18], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Button springs in
  const btnScale = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14, stiffness: 200 },
    from: 0,
    to: 1,
  });

  // Button "tap" squish: at frame 30 it scales down, recovers by frame 42
  const tapSquish = interpolate(
    frame,
    [30, 36, 42],
    [1, 0.91, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const finalBtnScale = Math.max(btnScale, 0) * tapSquish;

  // Ripple / tap flash
  const tapFlash = interpolate(frame, [30, 32, 42], [0, 0.35, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // iPhone notification slides down from top
  const notifY = spring({
    frame: frame - 42,
    fps,
    config: { damping: 18, stiffness: 160 },
    from: -160,
    to: 0,
  });
  const notifOpacity = interpolate(frame, [42, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${COLORS.bgPoolTime1} 0%, ${COLORS.bgPoolTime2} 100%)`,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 48,
      }}
    >
      {/* iPhone notification banner */}
      <div
        style={{
          position: "absolute",
          top: 52,
          left: 60,
          right: 60,
          opacity: notifOpacity,
          transform: `translateY(${notifY}px)`,
          backgroundColor: "rgba(248,248,252,0.92)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderRadius: 22,
          padding: "18px 22px",
          display: "flex",
          alignItems: "center",
          gap: 18,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >
        {/* Telegram icon */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "#2AABEE",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width={34} height={34} viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.68 7.92c-.12.56-.44.7-.88.44l-2.44-1.8-1.18 1.14c-.13.13-.24.24-.49.24l.18-2.5 4.58-4.14c.2-.18-.04-.28-.3-.1L7.74 14.37l-2.4-.75c-.52-.16-.53-.52.11-.77l9.4-3.62c.43-.16.81.1.79.57z" />
          </svg>
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: 26,
              fontWeight: 700,
              color: "#000",
              letterSpacing: -0.3,
            }}
          >
            @UV_pool_bot
          </div>
          <div
            style={{
              fontFamily: `${assistantFont}, sans-serif`,
              fontSize: 28,
              color: "#333",
              direction: "rtl",
              marginTop: 3,
            }}
          >
            רועי הגיע לבריכה! 🏊
          </div>
        </div>

        <div
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 22,
            color: "#999",
            flexShrink: 0,
          }}
        >
          עכשיו
        </div>
      </div>

      {/* App context label */}
      <div
        style={{
          opacity: headingOpacity,
          transform: `translateY(${headingY}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            fontFamily: `${assistantFont}, sans-serif`,
            fontSize: 44,
            color: COLORS.inkSecondary,
            fontWeight: 600,
            direction: "rtl",
          }}
        >
          הגיע הזמן לבריכה?
        </div>
        <div
          style={{
            fontFamily: `${assistantFont}, sans-serif`,
            fontSize: 36,
            color: COLORS.inkTertiary,
            fontWeight: 400,
            direction: "rtl",
          }}
        >
          לחץ וכולם יידעו שהגעת
        </div>
      </div>

      {/* Check-in button */}
      <div
        style={{
          transform: `scale(${finalBtnScale})`,
          position: "relative",
        }}
      >
        {/* Tap flash overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 20,
            backgroundColor: "white",
            opacity: tapFlash,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            background: "linear-gradient(90deg, #0e93d4, #38b2e8)",
            boxShadow: "rgba(14,147,212,0.7) 0px 16px 36px -10px",
            borderRadius: 20,
            padding: "28px 72px",
            fontFamily: `${assistantFont}, sans-serif`,
            fontSize: 72,
            fontWeight: 800,
            color: "white",
            direction: "rtl",
            userSelect: "none",
          }}
        >
          אני בבריכה! 🏊
        </div>
      </div>

      {/* Tagline below button */}
      <div
        style={{
          opacity: interpolate(frame, [28, 45], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          fontFamily: `${suezOneFont}, sans-serif`,
          fontSize: 42,
          color: COLORS.poolBlue,
          direction: "rtl",
          textAlign: "center",
          maxWidth: 700,
        }}
      >
        ההודעה תישלח לכולם ב-Telegram
      </div>
    </AbsoluteFill>
  );
}
