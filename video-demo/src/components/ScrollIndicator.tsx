import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { assistantFont } from "../fonts";

export function ScrollIndicator({ duration }: { duration: number }) {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [duration - 14, duration - 8, duration - 2],
    [0, 0.7, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const y = interpolate(frame, [duration - 14, duration - 2], [0, -30], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          bottom: 90,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity,
          transform: `translateY(${y}px)`,
        }}
      >
        <div
          style={{
            width: 5,
            height: 48,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.55)",
            marginBottom: 10,
          }}
        />
        <div
          style={{
            fontFamily: `${assistantFont}, sans-serif`,
            fontSize: 30,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          ↑
        </div>
      </div>
    </AbsoluteFill>
  );
}
