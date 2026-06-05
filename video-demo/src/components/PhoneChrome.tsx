import React from "react";
import { AbsoluteFill } from "remotion";

export function PhoneChrome() {
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Dynamic Island */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: "50%",
          transform: "translateX(-50%)",
          width: 294,
          height: 36,
          backgroundColor: "black",
          borderRadius: 999,
        }}
      />

      {/* Status bar — time */}
      <div
        style={{
          position: "absolute",
          top: 18,
          left: 52,
          fontFamily: "system-ui, sans-serif",
          fontSize: 28,
          fontWeight: 700,
          color: "white",
          letterSpacing: -0.5,
        }}
      >
        9:41
      </div>

      {/* Status bar — signal + battery */}
      <div
        style={{
          position: "absolute",
          top: 22,
          right: 46,
          display: "flex",
          alignItems: "flex-end",
          gap: 6,
        }}
      >
        {/* Signal bars */}
        {[10, 14, 18].map((h, i) => (
          <div
            key={i}
            style={{
              width: 5,
              height: h,
              backgroundColor: "white",
              borderRadius: 2,
            }}
          />
        ))}

        {/* Battery */}
        <div
          style={{
            marginLeft: 8,
            width: 32,
            height: 17,
            border: "2.5px solid white",
            borderRadius: 4,
            position: "relative",
          }}
        >
          {/* Fill */}
          <div
            style={{
              position: "absolute",
              left: 2,
              top: 2,
              width: 19,
              height: 9,
              backgroundColor: "white",
              borderRadius: 2,
            }}
          />
          {/* Nub */}
          <div
            style={{
              position: "absolute",
              right: -6,
              top: 4,
              width: 4,
              height: 6,
              backgroundColor: "rgba(255,255,255,0.6)",
              borderRadius: "0 2px 2px 0",
            }}
          />
        </div>
      </div>

      {/* Home indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: "50%",
          transform: "translateX(-50%)",
          width: 134,
          height: 5,
          backgroundColor: "white",
          borderRadius: 999,
          opacity: 0.5,
        }}
      />
    </AbsoluteFill>
  );
}
