import React from "react";
import { Composition } from "remotion";
import { UVPoolStory } from "./UVPoolStory";
import { W, H, FPS, TOTAL_FRAMES } from "./constants";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="UVPoolStory"
      component={UVPoolStory}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={W}
      height={H}
    />
  </>
);
