import React from "react";
import { spring, useCurrentFrame, useVideoConfig, Img } from "remotion";

interface Props {
  src: string;
  label: string;
  x: number;
  y: number;
  delayFrames?: number;
  color: string;
  size?: number;
}

export const AvatarBubble: React.FC<Props> = ({
  src,
  label,
  x,
  y,
  delayFrames = 0,
  color,
  size = 100,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delayFrames,
    fps,
    config: { damping: 14, stiffness: 180, mass: 0.7 },
    from: 0,
    to: 1,
  });

  // Gentle idle bob
  const bobY = Math.sin((frame - delayFrames) * 0.08) * 8;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + bobY,
        transform: `translate(-50%, -50%) scale(${Math.max(scale, 0)})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: `5px solid ${color}`,
          boxShadow: `0 0 0 4px white, 0 10px 28px -6px ${color}88`,
          overflow: "hidden",
          backgroundColor: color,
        }}
      >
        <Img
          src={src}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <span
        style={{
          fontFamily: "Assistant, sans-serif",
          fontSize: 32,
          fontWeight: 700,
          color: "white",
          textShadow: "0 2px 8px rgba(0,0,0,0.6)",
          direction: "rtl",
        }}
      >
        {label}
      </span>
    </div>
  );
};
