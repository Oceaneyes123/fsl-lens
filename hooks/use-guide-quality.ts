"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LandmarkSnapshot } from "../components/camera-tracker";
import { areLandmarksInsideGuideFrame, areLandmarksSteady, type NormalizedLandmark } from "../lib/landmarks";
import { validateSampleQuality, type SampleQualityResult } from "../lib/sample-quality";
import type { Sign } from "../lib/signs";

type GuideQualityState = {
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

export function useGuideQuality({ snapshot, selectedSign, isDynamicSign }: {
  snapshot: LandmarkSnapshot | null;
  selectedSign: Sign;
  isDynamicSign: boolean;
}) {
  const history = useRef<NormalizedLandmark[][][]>([]);
  const [state, setState] = useState<Omit<GuideQualityState, "history" | "quality"> & { quality: SampleQualityResult | null }>({
    insideGuideFrame: false,
    steady: false,
    quality: null,
  });
  const resetQuality = useCallback(() => {
    history.current = [];
    setState({ insideGuideFrame: false, steady: false, quality: null });
  }, []);

  useEffect(() => {
    if (!snapshot) {
      resetQuality();
      return;
    }
    const next = advanceGuideQuality(history.current, snapshot, selectedSign.expectedHandCount, isDynamicSign);
    history.current = next.history;
    setState({ insideGuideFrame: next.insideGuideFrame, steady: next.steady, quality: next.quality });
  }, [isDynamicSign, resetQuality, selectedSign.expectedHandCount, snapshot]);

  return { ...state, resetQuality };
}
