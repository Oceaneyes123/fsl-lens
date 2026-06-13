import { recognizeDynamicSequence, type DynamicSequenceModel } from "./dynamic-recognition";
import type { LandmarkFrame } from "./dynamic-landmarks";
import {
  createNoModelResult,
  recognizeLandmarks,
  type KnnModel,
  type RecognitionResult,
} from "./recognition";
import type { NormalizedLandmark } from "./landmarks";

export function recognizeVisibleSign({
  model,
  dynamicModel,
  landmarks,
  dynamicFrames,
  handCount,
  handedness,
}: {
  model: KnnModel | null;
  dynamicModel: DynamicSequenceModel | null;
  landmarks: NormalizedLandmark[][];
  dynamicFrames: LandmarkFrame[];
  handCount: number;
  handedness: string[];
}): RecognitionResult {
  const staticResult = model
    ? recognizeLandmarks({
        model,
        landmarks,
        handCount,
        handedness,
      })
    : null;
  const dynamicResult =
    dynamicModel && dynamicFrames.length >= 2
      ? toRecognitionResult(
          recognizeDynamicSequence({
            model: dynamicModel,
            frames: dynamicFrames,
            handCount,
          }),
        )
      : null;

  if (
    dynamicResult?.state === "confirmed" &&
    (!staticResult || staticResult.state !== "confirmed" || dynamicResult.confidence >= staticResult.confidence)
  ) {
    return dynamicResult;
  }

  return staticResult ?? dynamicResult ?? createNoModelResult("No active recognition model is loaded yet.");
}

function toRecognitionResult(result: ReturnType<typeof recognizeDynamicSequence>): RecognitionResult {
  return {
    ...result,
    stable: false,
    stableFrameCount: 0,
  };
}
