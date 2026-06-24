"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LandmarkSnapshot } from "@/components/camera-tracker";
import { detectionSettings, type DetectionMode } from "@/lib/detection/detection-config";
import { DetectionModeRouter } from "@/lib/detection/detection-mode-router";
import { createIdleRecognitionResult, createNoModelResult } from "@/lib/detection/prediction-result";
import type { DynamicSequenceModel, KnnModel } from "@/lib/models/model-types";

export function useDetectionRouter({ model, dynamicModel, modelMessage }: {
  model: KnnModel | null;
  dynamicModel: DynamicSequenceModel | null;
  modelMessage: string;
}) {
  const router = useRef(new DetectionModeRouter());
  const [detectionMode, setMode] = useState<DetectionMode>(detectionSettings.defaultMode);

  useEffect(() => {
    if (model) router.current.loadStaticModel(model);
  }, [model]);

  useEffect(() => {
    if (dynamicModel) router.current.loadDynamicModel(dynamicModel);
  }, [dynamicModel]);

  const setDetectionMode = useCallback((mode: DetectionMode) => {
    router.current.setMode(mode);
    setMode(mode);
  }, []);
  const predictSnapshot = useCallback((snapshot: LandmarkSnapshot | null) => {
    if (snapshot) return router.current.predict(snapshot);
    router.current.predict(null);
    return model ? createIdleRecognitionResult() : createNoModelResult(modelMessage);
  }, [model, modelMessage]);
  const resetRouter = useCallback(() => router.current.reset(), []);

  return { detectionMode, setDetectionMode, predictSnapshot, resetRouter };
}
