import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from "remotion";
import { COLORS, HOURLY_UV, uvColor } from "../constants";
import { assistantFont, suezOneFont } from "../fonts";

const CHART_W = 880;
const CHART_H = 480;
const PAD_X = 40;
const PAD_Y = 44;
const MAX_UV = 12;

export default function Scene3Chart() {
  const frame = useCurrentFrame();

  // Title fades in immediately
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 20], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Card slides up slightly on entry
  const cardY = interpolate(frame, [0, 20], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Chart reveal sweeps left-to-right over frames 8–68
  const revealPct = interpolate(frame, [8, 68], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const revealX = revealPct * CHART_W;

  const data = HOURLY_UV;
  const stepX = (CHART_W - PAD_X * 2) / (data.length - 1);

  const pts = data.map((d, i) => ({
    x: PAD_X + i * stepX,
    y: CHART_H - PAD_Y - (d.uv / MAX_UV) * (CHART_H - PAD_Y * 2),
    uv: d.uv,
  }));

  const polylineStr = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const areaStr =
    `${pts[0].x},${CHART_H - PAD_Y} ` +
    polylineStr +
    ` ${pts[pts.length - 1].x},${CHART_H - PAD_Y}`;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${COLORS.bgDay1} 0%, ${COLORS.bgDay2} 100%)`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* White card */}
      <div
        style={{
          transform: `translateY(${cardY}px)`,
          width: 960,
          backgroundColor: "white",
          borderRadius: 40,
          padding: "48px 40px 44px",
          boxShadow: "0 24px 60px -12px rgba(10,115,173,0.22)",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              fontFamily: `${suezOneFont}, sans-serif`,
              fontSize: 72,
              color: COLORS.darkInk,
              direction: "rtl",
              textAlign: "center",
            }}
          >
            מדד UV היום
          </div>
          <div
            style={{
              fontFamily: `${assistantFont}, sans-serif`,
              fontSize: 38,
              color: COLORS.inkSecondary,
              fontWeight: 600,
              direction: "rtl",
            }}
          >
            באר שבע · 07:00 עד 19:00
          </div>
        </div>

        {/* Chart SVG */}
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          width={CHART_W}
          height={CHART_H}
        >
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={COLORS.uvPurple} stopOpacity={0.5} />
              <stop offset="30%"  stopColor={COLORS.uvRed}    stopOpacity={0.35} />
              <stop offset="65%"  stopColor={COLORS.uvOrange} stopOpacity={0.2} />
              <stop offset="100%" stopColor={COLORS.uvGreen}  stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="strokeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={COLORS.uvPurple} />
              <stop offset="35%"  stopColor={COLORS.uvRed} />
              <stop offset="65%"  stopColor={COLORS.uvOrange} />
              <stop offset="100%" stopColor={COLORS.uvGreen} />
            </linearGradient>
            <clipPath id="revealClip">
              <rect x={0} y={0} width={revealX} height={CHART_H + 20} />
            </clipPath>
          </defs>

          {/* Grid lines */}
          {[3, 6, 9, 12].map((lvl) => {
            const gy = CHART_H - PAD_Y - (lvl / MAX_UV) * (CHART_H - PAD_Y * 2);
            return (
              <line
                key={lvl}
                x1={PAD_X}
                y1={gy}
                x2={CHART_W - PAD_X}
                y2={gy}
                stroke={COLORS.poolBlue}
                strokeWidth={1.5}
                strokeDasharray="6 6"
                opacity={0.2}
              />
            );
          })}

          {/* Ghost area — always visible */}
          <polygon points={areaStr} fill="url(#areaFill)" opacity={0.18} />

          {/* Revealed content */}
          <g clipPath="url(#revealClip)">
            <polygon points={areaStr} fill="url(#areaFill)" />
            <polyline
              points={polylineStr}
              fill="none"
              stroke="url(#strokeGrad)"
              strokeWidth={7}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {pts.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={11}
                fill={uvColor(p.uv)}
                stroke="white"
                strokeWidth={4}
              />
            ))}
          </g>

          {/* X-axis labels */}
          {data
            .filter((_, i) => i % 3 === 0)
            .map((d, i) => {
              const x = PAD_X + i * 3 * stepX;
              return (
                <text
                  key={i}
                  x={x}
                  y={CHART_H - 8}
                  textAnchor="middle"
                  fill={COLORS.inkTertiary}
                  fontSize={26}
                  fontFamily="Assistant, sans-serif"
                  fontWeight={600}
                >
                  {d.hour}
                </text>
              );
            })}
        </svg>
      </div>
    </AbsoluteFill>
  );
}
