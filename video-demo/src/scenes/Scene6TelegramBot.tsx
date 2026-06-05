import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { COLORS } from "../constants";
import { assistantFont } from "../fonts";

const PHONE_W = 680;
const PHONE_H = 1100;

function ChatBubble({
  text,
  side,
  delay,
  frame,
  fps,
}: {
  text: string;
  side: "left" | "right";
  delay: number;
  frame: number;
  fps: number;
}) {
  const sc = spring({
    frame: frame - delay,
    fps,
    config: { damping: 16, stiffness: 200, mass: 0.7 },
    from: 0,
    to: 1,
  });
  const x = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 180 },
    from: side === "right" ? 60 : -60,
    to: 0,
  });

  const isRight = side === "right";
  return (
    <div
      style={{
        alignSelf: isRight ? "flex-end" : "flex-start",
        transform: `scale(${Math.max(sc, 0)}) translateX(${x}px)`,
        background: isRight ? COLORS.telegram : "#f0f0f0",
        color: isRight ? "white" : "#000",
        borderRadius: isRight ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        padding: "14px 18px",
        maxWidth: "78%",
        fontFamily: `${assistantFont}, sans-serif`,
        fontSize: 30,
        direction: "rtl",
        lineHeight: 1.4,
        boxShadow: isRight
          ? "0 2px 8px rgba(42,171,238,0.3)"
          : "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      {text}
    </div>
  );
}

export default function Scene6TelegramBot() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phone slides up
  const phoneY = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 140 },
    from: 320,
    to: 0,
  });

  // Calendar card springs in
  const calScale = spring({
    frame: frame - 42,
    fps,
    config: { damping: 14, stiffness: 180 },
    from: 0,
    to: 1,
  });

  // "Sent" confirmation
  const sentOpacity = interpolate(frame, [62, 72], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.darkInk,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Subtle radial glow */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.telegram}18 0%, transparent 65%)`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />

      {/* Phone frame */}
      <div
        style={{
          transform: `translateY(${phoneY}px)`,
          width: PHONE_W,
          height: PHONE_H,
          backgroundColor: "#f5f5f5",
          borderRadius: 44,
          overflow: "hidden",
          boxShadow:
            "0 0 0 3px rgba(255,255,255,0.12), 0 40px 80px -20px rgba(0,0,0,0.8)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Telegram header */}
        <div
          style={{
            background: COLORS.telegram,
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexShrink: 0,
          }}
        >
          {/* Bot avatar */}
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              flexShrink: 0,
            }}
          >
            🤖
          </div>
          <div>
            <div
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: 26,
                fontWeight: 700,
                color: "white",
              }}
            >
              @UV_pool_bot
            </div>
            <div
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: 20,
                color: "rgba(255,255,255,0.75)",
              }}
            >
              bot · online
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div
          style={{
            flex: 1,
            background: "#e9f5fb",
            backgroundImage:
              "radial-gradient(circle at 20% 80%, rgba(14,147,212,0.06) 0%, transparent 50%)",
            padding: "20px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            overflowY: "hidden",
          }}
        >
          {/* User message */}
          <ChatBubble
            text="בוס, תזמן לי ביקור ל-14:00 ☀️"
            side="right"
            delay={10}
            frame={frame}
            fps={fps}
          />

          {/* Bot response */}
          <ChatBubble
            text="בטח! הנה הזמנה ליומן שלך 📅"
            side="left"
            delay={26}
            frame={frame}
            fps={fps}
          />

          {/* Google Calendar card */}
          <div
            style={{
              alignSelf: "flex-start",
              transform: `scale(${Math.max(calScale, 0)})`,
              transformOrigin: "top left",
              width: "88%",
              background: "white",
              borderRadius: 18,
              overflow: "hidden",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            }}
          >
            {/* Calendar header strip */}
            <div
              style={{
                background: "#4285F4",
                padding: "12px 18px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <svg width={24} height={24} viewBox="0 0 24 24" fill="white">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zM9 14H7v2h2v-2zm4 0h-2v2h2v-2z" />
              </svg>
              <span
                style={{
                  fontFamily: "system-ui, sans-serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "white",
                }}
              >
                Google Calendar
              </span>
            </div>

            <div style={{ padding: "16px 18px 14px" }}>
              <div
                style={{
                  fontFamily: `${assistantFont}, sans-serif`,
                  fontSize: 30,
                  fontWeight: 800,
                  color: COLORS.darkInk,
                  direction: "rtl",
                  marginBottom: 6,
                }}
              >
                🏊 ביקור בבריכה
              </div>
              <div
                style={{
                  fontFamily: `${assistantFont}, sans-serif`,
                  fontSize: 24,
                  color: COLORS.inkSecondary,
                  direction: "rtl",
                  marginBottom: 4,
                }}
              >
                יום חמישי, 5 יוני
              </div>
              <div
                style={{
                  fontFamily: `${assistantFont}, sans-serif`,
                  fontSize: 24,
                  color: COLORS.inkSecondary,
                  direction: "rtl",
                  marginBottom: 14,
                }}
              >
                🕑 14:00 – 16:00
              </div>
              <div
                style={{
                  background: "#4285F4",
                  borderRadius: 10,
                  padding: "12px 20px",
                  textAlign: "center",
                  fontFamily: `${assistantFont}, sans-serif`,
                  fontSize: 24,
                  fontWeight: 700,
                  color: "white",
                }}
              >
                פתח ב-Google Calendar ↗
              </div>
            </div>
          </div>

          {/* Sent confirmation */}
          <div
            style={{
              opacity: sentOpacity,
              alignSelf: "flex-start",
              fontFamily: `${assistantFont}, sans-serif`,
              fontSize: 26,
              color: "#34a853",
              fontWeight: 700,
              direction: "rtl",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            ✅ הזמנה נשלחה ליומן!
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
