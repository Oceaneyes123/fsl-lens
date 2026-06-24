"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { detectionSettings, type DetectionMode } from "@/lib/detection/detection-config";
import type { LandmarkSnapshot } from "@/lib/detection/landmark-snapshot";
import { DetectionModeRouter } from "@/lib/detection/detection-mode-router";
import { createIdleRecognitionResult, createNoModelResult } from "@/lib/detection/prediction-result";
import type { DynamicSequenceModel, KnnModel } from "@/lib/models/model-types";

export function useDetectionRouter({ model, dynamicModel, modelMessage, dynamicModelMessage }: {
  model: KnnModel | null;
  dynamicModel: DynamicSequenceModel | null;
  modelMessage: string;
  dynamicModelMessage: string;
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
    const activeModel = detectionMode === "static" ? model : dynamicModel;
    const activeModelMessage = detectionMode === "static" ? modelMessage : dynamicModelMessage;
    if (snapshot) return activeModel ? router.current.predict(snapshot) : createNoModelResult(activeModelMessage);
    router.current.predict(null);
    return activeModel ? createIdleRecognitionResult() : createNoModelResult(activeModelMessage);
  }, [detectionMode, dynamicModel, dynamicModelMessage, model, modelMessage]);
  const resetRouter = useCallback(() => router.current.reset(), []);

  return { detectionMode, setDetectionMode, predictSnapshot, resetRouter };
}
