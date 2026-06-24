import type { RecognitionResult } from "./prediction-result";

type ConfirmationInput = {
  rawRecognition: Omit<RecognitionResult, "stable" | "stableFrameCount">;
  stableState: { stable: boolean; count: number };
  requiredStableFrames: number;
};

function applyConfirmation(
  { rawRecognition, stableState, requiredStableFrames }: ConfirmationInput,
  confirmedMessage: string,
  pendingMessage: string,
): RecognitionResult {
  const confirmed = rawRecognition.state === "confirmed" && stableState.stable;

  return {
    ...rawRecognition,
    state: confirmed ? "confirmed" : rawRecognition.state === "confirmed" ? "uncertain" : rawRecognition.state,
    stable: stableState.stable,
    stableFrameCount: stableState.count,
    message: confirmed
      ? confirmedMessage
      : rawRecognition.state === "confirmed"
        ? `${pendingMessage} (${stableState.count}/${requiredStableFrames}).`
        : rawRecognition.message,
  };
}

export function applyStaticConfirmation(input: ConfirmationInput) {
  return applyConfirmation(input, "Prediction confirmed.", "Hold steady for confirmation");
}

export function applyDynamicConfirmation(input: ConfirmationInput) {
  return applyConfirmation(input, "Dynamic prediction confirmed.", "Repeat the motion for confirmation");
}
