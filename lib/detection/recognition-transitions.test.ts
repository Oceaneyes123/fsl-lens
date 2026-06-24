import { describe, expect, it } from "vitest";
import type { RecognitionResult } from "./prediction-result";
import { applyDynamicConfirmation, applyStaticConfirmation } from "./recognition-transitions";

const confirmed: RecognitionResult = {
  state: "confirmed",
  predictedLabel: "alphabet_A",
  confidence: 0.98,
  topPredictions: [],
  stable: false,
  stableFrameCount: 0,
  message: "Raw confirmation.",
};

describe("recognition confirmation transitions", () => {
  it.each([
    [applyStaticConfirmation, true, "confirmed", "Prediction confirmed."],
    [applyStaticConfirmation, false, "uncertain", "Hold steady for confirmation (2/5)."],
    [applyDynamicConfirmation, true, "confirmed", "Dynamic prediction confirmed."],
    [applyDynamicConfirmation, false, "uncertain", "Repeat the motion for confirmation (2/5)."],
  ] as const)("applies the expected confirmation state", (applyConfirmation, stable, state, message) => {
    expect(applyConfirmation({
      rawRecognition: confirmed,
      stableState: { stable, count: 2 },
      requiredStableFrames: 5,
    })).toMatchObject({ state, message, stable, stableFrameCount: 2 });
  });

  it.each([applyStaticConfirmation, applyDynamicConfirmation])("preserves a non-confirmed raw result", (applyConfirmation) => {
    const rawRecognition: RecognitionResult = { ...confirmed, state: "uncertain", message: "Keep trying." };

    expect(applyConfirmation({
      rawRecognition,
      stableState: { stable: false, count: 1 },
      requiredStableFrames: 5,
    })).toMatchObject({ state: "uncertain", message: "Keep trying.", stable: false, stableFrameCount: 1 });
  });
});
