import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Img,
  staticFile,
} from "remotion";

import { UVArcGauge, computeFillUV, needleTip } from "../components/UVArcGauge";
import { COLORS, GAUGE } from "../constants";
import { assistantFont, suezOneFont } from "../fonts";

const TARGET_UV = 9.2;
const GAUGE_DISPLAY_W = 960;
const GAUGE_SCALE = GAUGE_DISPLAY_W / GAUGE.viewW;
const GAUGE_DISPLAY_H = GAUGE.viewH * GAUGE_SCALE;
const YUVI_SIZE = 88;

export default function Scene2Gauge() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Card slides up from below
  const cardY = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 140 },
    from: 380,
    to: 0,
  });

  // Verdict badge appears after needle settles
  const verdictOpacity = interpolate(frame, [72, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const verdictScale = spring({
    frame: frame - 72,
    fps,
    config: { damping: 15, stiffness: 180 },
    from: 0.85,
    to: 1,
  });

  const NEEDLE_DELAY = 22;
  // Avatar uses same computeFillUV as UVArcGauge — pixel-perfect sync
  const fillUV = computeFillUV(Math.max(0, frame - NEEDLE_DELAY), TARGET_UV);
  const tip = needleTip(fillUV);
  const yuviX = tip.x * GAUGE_SCALE - YUVI_SIZE / 2;
  const yuviY = tip.y * GAUGE_SCALE - YUVI_SIZE / 2;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${COLORS.bgPoolTime1} 0%, ${COLORS.bgPoolTime2} 100%)`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Warm sun glow in top-left corner */}
      <div
        style={{
          position: "absolute",
          top: -200,
          left: -200,
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.sunGold}33 0%, transparent 65%)`,
          pointerEvents: "none",
        }}
      />

      {/* Main card */}
      <div
        style={{
          transform: `translateY(${cardY}px)`,
          width: GAUGE_DISPLAY_W,
          backgroundColor: "white",
          borderRadius: 40,
          padding: "52px 48px 48px",
          boxShadow: "0 32px 80px -16px rgba(10,115,173,0.32)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        {/* Question heading */}
        <div
          style={{
            fontFamily: `${assistantFont}, sans-serif`,
            fontSize: 52,
            fontWeight: 700,
            color: COLORS.inkSecondary,
            textAlign: "center",
            direction: "rtl",
          }}
        >
          בריכה עכשיו?
        </div>

        {/* Gauge + Yuvi overlay */}
        <div
          style={{
            position: "relative",
            width: GAUGE_DISPLAY_W,
            height: GAUGE_DISPLAY_H,
          }}
        >
          <UVArcGauge targetUV={TARGET_UV} delayFrames={NEEDLE_DELAY} />

          {/* Yuvi avatar rides the needle tip */}
          <Img
            src={staticFile("yuvi/male.png")}
            style={{
              position: "absolute",
              left: yuviX,
              top: yuviY,
              width: YUVI_SIZE,
              height: YUVI_SIZE,
              borderRadius: "50%",
              objectFit: "cover",
              border: "5px solid white",
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Verdict badge */}
        <div
          style={{
            opacity: verdictOpacity,
            transform: `scale(${Math.max(verdictScale, 0)})`,
            background: `linear-gradient(135deg, #b91c1c, ${COLORS.uvRed})`,
            borderRadius: 999,
            padding: "22px 72px",
            boxShadow: "0 14px 40px -10px #ef444488",
          }}
        >
          <span
            style={{
              fontFamily: `${suezOneFont}, sans-serif`,
              fontSize: 68,
              color: "white",
              direction: "rtl",
              unicodeBidi: "embed",
            }}
          >
            {`מהר לבריכה‏! 🏊`}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
}
