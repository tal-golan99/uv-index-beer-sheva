import { loadFont as loadAssistant } from "@remotion/google-fonts/Assistant";
import { loadFont as loadSuezOne } from "@remotion/google-fonts/SuezOne";

export const { fontFamily: assistantFont } = loadAssistant("normal", {
  subsets: ["hebrew", "latin"],
  weights: ["400", "600", "700", "800"],
});

export const { fontFamily: suezOneFont } = loadSuezOne("normal", {
  subsets: ["hebrew", "latin"],
});
