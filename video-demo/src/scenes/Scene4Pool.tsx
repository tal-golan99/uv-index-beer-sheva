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
import { AvatarBubble } from "../components/AvatarBubble";
import { COLORS } from "../constants";
import { assistantFont, suezOneFont } from "../fonts";

const AVATARS = [
  {
    src: staticFile("yuvi/male.png"),
    label: "יובי",
    x: 230,
    y: 1340,
    color: "#38bdf8",
    delay: 10,
  },
  {
    src: staticFile("yuvi/female.png"),
    label: "יובי",
    x: 540,
    y: 1430,
    color: "#f472b6",
    delay: 26,
  },
  {
    src: staticFile("more/IMG_9931.JPG"),
    label: "מור",
    x: 855,
    y: 1320,
    color: "#34d399",
    delay: 42,
  },
];

export default function Scene4Pool() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Ken Burns: slow zoom-out on the pool photo
  const photoScale = interpolate(frame, [0, 90], [1.08, 1.0], {
    extrapolateRight: "clamp",
  });

  // Dark overlay fades in
  const overlayOpacity = interpolate(frame, [0, 20], [0, 0.65], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Heading slides down from above
  const headingOpacity = interpolate(frame, [6, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headingY = interpolate(frame, [6, 30], [-36, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Count badge pops in
  const badgeScale = spring({
    frame: frame - 18,
    fps,
    config: { damping: 14, stiffness: 200 },
    from: 0,
    to: 1,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.darkInk }}>
      {/* Pool photo, full-bleed with Ken Burns */}
      <Img
        src={staticFile("pool/pool.jpg")}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${photoScale})`,
          transformOrigin: "center center",
        }}
      />

      {/* Blue-tinted gradient overlay */}
      <AbsoluteFill
        style={{
          opacity: overlayOpacity,
          background: `linear-gradient(180deg,
            rgba(14,147,212,0.5) 0%,
            rgba(3,105,161,0.7) 60%,
            rgba(12,27,41,0.85) 100%)`,
        }}
      />

      {/* Heading section */}
      <div
        style={{
          position: "absolute",
          top: 140,
          left: 0,
          right: 0,
          opacity: headingOpacity,
          transform: `translateY(${headingY}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
        }}
      >
        <div
          style={{
            fontFamily: `${suezOneFont}, sans-serif`,
            fontSize: 88,
            color: "white",
            textShadow: "0 4px 20px rgba(0,0,0,0.5)",
            direction: "rtl",
            textAlign: "center",
          }}
        >
          מי בבריכה עכשיו?
        </div>

        {/* Count badge */}
        <div
          style={{
            transform: `scale(${Math.max(badgeScale, 0)})`,
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            backgroundColor: "rgba(255,255,255,0.18)",
            backdropFilter: "blur(12px)",
            borderRadius: 999,
            padding: "18px 52px",
            border: "2px solid rgba(255,255,255,0.35)",
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
            3 בפנים 🏊
          </span>
        </div>
      </div>

      {/* Avatar bubbles — each springs in with stagger */}
      {AVATARS.map((av) => (
        <AvatarBubble
          key={av.label}
          src={av.src}
          label={av.label}
          x={av.x}
          y={av.y}
          delayFrames={av.delay}
          color={av.color}
          size={110}
        />
      ))}
    </AbsoluteFill>
  );
}
