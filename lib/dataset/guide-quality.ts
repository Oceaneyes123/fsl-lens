import type { LandmarkSnapshot } from "@/lib/detection/landmark-snapshot";
import { areLandmarksInsideGuideFrame, areLandmarksSteady, type NormalizedLandmark } from "../landmarks";
import { validateSampleQuality, type SampleQualityResult } from "./sample-quality";

export type GuideQualityState = {
  history: NormalizedLandmark[][][];
  insideGuideFrame: boolean;
  steady: boolean;
  quality: SampleQualityResult;
};

export function advanceGuideQuality(
  history: NormalizedLandmark[][][],
  snapshot: Pick<LandmarkSnapshot, "landmarks" | "handCount" | "confidence">,
  expectedHandCount: number,
  isDynamicSign: boolean,
): GuideQualityState {
  const nextHistory = [...history.slice(-4), snapshot.landmarks];
  const insideGuideFrame = areLandmarksInsideGuideFrame(snapshot.landmarks);
  const steady = areLandmarksSteady(nextHistory);
  return {
    history: nextHistory,
    insideGuideFrame,
    steady,
    quality: validateSampleQuality({
      detectedHandCount: snapshot.handCount,
      expectedHandCount,
      detectorConfidence: snapshot.confidence,
      landmarksVisible: snapshot.landmarks.length > 0,
      insideGuideFrame,
      steady,
      requireSteady: !isDynamicSign,
    }),
  };
}
