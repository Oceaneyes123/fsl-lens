"use client";

import { useEffect, useRef, useState } from "react";
import { DetectionModeRouter } from "@/lib/detection/detection-mode-router";
import type { DetectionMode } from "@/lib/detection/detection-config";
import { createIdleRecognitionResult, type RecognitionResult } from "@/lib/detection/prediction-result";
import type { DynamicSequenceModel, KnnModel } from "@/lib/models/model-types";
import type { LandmarkSnapshot } from "@/components/camera-tracker";

export function useDetectionRouter({ mode, model, dynamicModel, snapshot }: { mode: DetectionMode; model: KnnModel | null; dynamicModel: DynamicSequenceModel | null; snapshot: LandmarkSnapshot | null }) {
  const router = useRef(new DetectionModeRouter());
  const [result, setResult] = useState<RecognitionResult>(() => createIdleRecognitionResult());
  useEffect(() => { if (model) router.current.loadStaticModel(model); }, [model]);
  useEffect(() => { if (dynamicModel) router.current.loadDynamicModel(dynamicModel); }, [dynamicModel]);
  useEffect(() => { router.current.setMode(mode); setResult(router.current.predict(snapshot)); }, [mode, snapshot]);
  return result;
}
