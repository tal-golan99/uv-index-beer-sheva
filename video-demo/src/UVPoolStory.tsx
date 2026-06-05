import React from "react";
import { AbsoluteFill, Sequence, Audio, staticFile } from "remotion";
import { SCENES } from "./constants";
import Scene1Hero from "./scenes/Scene1Hero";
import Scene2Gauge from "./scenes/Scene2Gauge";
import Scene3Chart from "./scenes/Scene3Chart";
import Scene4Pool from "./scenes/Scene4Pool";
import Scene5Notification from "./scenes/Scene5Notification";
import Scene6TelegramBot from "./scenes/Scene6TelegramBot";
import Scene5CTA from "./scenes/Scene5CTA";
import { ScrollIndicator } from "./components/ScrollIndicator";
import { PhoneChrome } from "./components/PhoneChrome";

export const UVPoolStory: React.FC = () => (
  <AbsoluteFill>
    <Audio src={staticFile("audio/bg.mp3")} volume={0.55} />
    <Sequence from={SCENES.s1.from} durationInFrames={SCENES.s1.duration}>
      <Scene1Hero />
      <ScrollIndicator duration={SCENES.s1.duration} />
    </Sequence>

    <Sequence from={SCENES.s2.from} durationInFrames={SCENES.s2.duration}>
      <Scene2Gauge />
      <ScrollIndicator duration={SCENES.s2.duration} />
    </Sequence>

    <Sequence from={SCENES.s3.from} durationInFrames={SCENES.s3.duration}>
      <Scene3Chart />
      <ScrollIndicator duration={SCENES.s3.duration} />
    </Sequence>

    <Sequence from={SCENES.s4.from} durationInFrames={SCENES.s4.duration}>
      <Scene4Pool />
      <ScrollIndicator duration={SCENES.s4.duration} />
    </Sequence>

    <Sequence from={SCENES.s5.from} durationInFrames={SCENES.s5.duration}>
      <Scene5Notification />
      <ScrollIndicator duration={SCENES.s5.duration} />
    </Sequence>

    <Sequence from={SCENES.s6.from} durationInFrames={SCENES.s6.duration}>
      <Scene6TelegramBot />
      <ScrollIndicator duration={SCENES.s6.duration} />
    </Sequence>

    <Sequence from={SCENES.s7.from} durationInFrames={SCENES.s7.duration}>
      <Scene5CTA />
    </Sequence>

    <PhoneChrome />
  </AbsoluteFill>
);
