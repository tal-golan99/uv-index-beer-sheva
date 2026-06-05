import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, GAUGE, uvColor } from "../constants";

// Linear fill — used for both the arc color and the needle/avatar position.
// delayedFrame = Math.max(0, frame - NEEDLE_DELAY) in the caller.
export function computeFillUV(delayedFrame: number, targetUV: number): number {
  return interpolate(delayedFrame, [0, 60], [0, targetUV], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

// Returns the SVG-space (x, y) of the needle tip at a given UV value.
export function needleTip(uv: number): { x: number; y: number } {
  const angle = Math.PI - (Math.max(0, Math.min(uv, 11)) / 11) * Math.PI;
  return {
    x: GAUGE.cx + GAUGE.r * Math.cos(angle),
    y: GAUGE.cy - GAUGE.r * Math.sin(angle),
  };
}

interface Props {
  targetUV: number;
  delayFrames?: number;
}

export const UVArcGauge: React.FC<Props> = ({ targetUV, delayFrames = 0 }) => {
  const frame = useCurrentFrame();
  const delayed = Math.max(0, frame - delayFrames);

  const fillUV = computeFillUV(delayed, targetUV);

  const pct = Math.min(fillUV / 11, 1);
  const dashLen = pct * GAUGE.arcLen;
  const dashOffset = GAUGE.arcLen - dashLen;

  const tip = needleTip(fillUV);
  const color = uvColor(Math.max(fillUV, 0.1));

  // sweep=1 → clockwise in SVG (y-down) = goes UPWARD over the top
  const arcPath = `M ${GAUGE.cx - GAUGE.r} ${GAUGE.cy} A ${GAUGE.r} ${GAUGE.r} 0 0 1 ${GAUGE.cx + GAUGE.r} ${GAUGE.cy}`;

  return (
    <svg
      viewBox={`0 0 ${GAUGE.viewW} ${GAUGE.viewH}`}
      width="100%"
      height="100%"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="arcGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"    stopColor={COLORS.uvGreen} />
          <stop offset="25%"   stopColor={COLORS.uvYellow} />
          <stop offset="50%"   stopColor={COLORS.uvOrange} />
          <stop offset="75%"   stopColor={COLORS.uvRed} />
          <stop offset="100%"  stopColor={COLORS.uvPurple} />
        </linearGradient>
        <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Track (faint full arc) */}
      <path
        d={arcPath}
        fill="none"
        stroke="url(#arcGradient)"
        strokeWidth={44}
        strokeLinecap="round"
        opacity={0.22}
      />

      {/* Filled colored arc */}
      <path
        d={arcPath}
        fill="none"
        stroke="url(#arcGradient)"
        strokeWidth={44}
        strokeLinecap="round"
        strokeDasharray={`${GAUGE.arcLen}`}
        strokeDashoffset={dashOffset}
        filter="url(#gaugeGlow)"
      />

      {/* Needle glow circle */}
      <circle cx={tip.x} cy={tip.y} r={52} fill={color} opacity={0.4} />

      {/* Needle solid circle */}
      <circle
        cx={tip.x}
        cy={tip.y}
        r={38}
        fill={color}
        stroke="white"
        strokeWidth={7}
        filter="url(#dotGlow)"
      />

      {/* UV number */}
      <text
        x={GAUGE.cx}
        y={GAUGE.cy - 80}
        textAnchor="middle"
        fill={COLORS.darkInk}
        fontSize={180}
        fontWeight={800}
        fontFamily="Assistant, sans-serif"
      >
        {fillUV.toFixed(1)}
      </text>

      {/* Label */}
      <text
        x={GAUGE.cx}
        y={GAUGE.cy + 20}
        textAnchor="middle"
        fill={COLORS.inkSecondary}
        fontSize={52}
        fontFamily="Assistant, sans-serif"
        fontWeight={600}
        direction="rtl"
        unicodeBidi="embed"
      >
        מדד UV
      </text>
    </svg>
  );
};
