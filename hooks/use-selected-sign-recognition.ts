"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LandmarkSnapshot } from "@/lib/detection/landmark-snapshot";
import { applyDynamicConfirmation, applyStaticConfirmation } from "@/lib/detection/recognition-transitions";
import { createDynamicFrameBuffer } from "@/lib/dynamic-capture";
import type { LandmarkFrame } from "@/lib/dynamic-landmarks";
import { recognizeDynamicSequence } from "@/lib/dynamic-recognition";
import type { DynamicSequenceModel, KnnModel } from "@/lib/models/model-types";
import { createPredictionTracker } from "@/lib/prediction";
import { createIdleRecognitionResult, createNoModelResult, recognizeLandmarks, type RecognitionResult } from "@/lib/recognition";
import type { Sign } from "@/lib/signs";

export function useSelectedSignRecognition({
  snapshot,
  selectedSign,
  isDynamicSign,
  model,
  dynamicModel,
  modelMessage,
  dynamicModelMessage,
  requiredStableFrames,
  addDynamicFrame,
}: {
  snapshot: LandmarkSnapshot | null;
  selectedSign: Sign;
  isDynamicSign: boolean;
  model: KnnModel | null;
  dynamicModel: DynamicSequenceModel | null;
  modelMessage: string;
  dynamicModelMessage: string;
  requiredStableFrames: number;
  addDynamicFrame?: (frame: LandmarkFrame, confidence: number) => void;
}) {
  const [recognition, setRecognition] = useState<RecognitionResult>(() => createNoModelResult("Loading recognition model..."));
  const staticTracker = useRef(createPredictionTracker({ requiredFrames: 5 }));
  const dynamicTracker = useRef(createPredictionTracker({ requiredFrames: 2 }));
  const dynamicFrames = useRef(createDynamicFrameBuffer({ maxFrames: 45 }));
  const resetRecognition = useCallback(() => {
    staticTracker.current.update(null);
    dynamicTracker.current.update(null);
  }, []);
  const clearDynamicFrameBuffer = useCallback(() => dynamicFrames.current.clear(), []);

  useEffect(() => {
    resetRecognition();
    clearDynamicFrameBuffer();
  }, [clearDynamicFrameBuffer, resetRecognition, selectedSign.label]);

  useEffect(() => {
    if (!snapshot) {
      resetRecognition();
      clearDynamicFrameBuffer();
      setRecognition(isDynamicSign
        ? (dynamicModel ? createIdleRecognitionResult() : createNoModelResult(dynamicModelMessage))
        : (model ? createIdleRecognitionResult() : createNoModelResult(modelMessage)));
      return;
    }

    if (isDynamicSign) {
      dynamicFrames.current.add(snapshot.landmarks);
      addDynamicFrame?.(snapshot.landmarks, snapshot.confidence);
      if (!dynamicModel) {
        dynamicTracker.current.update(null);
        setRecognition(createNoModelResult(dynamicModelMessage));
        return;
      }
      const frames = dynamicFrames.current.frames();
      if (frames.length < 2) {
        dynamicTracker.current.update(null);
        setRecognition(createIdleRecognitionResult("Move through the full sign inside the guide frame."));
        return;
      }
      const rawRecognition = recognizeDynamicSequence({ model: dynamicModel, frames, handCount: snapshot.handCount });
      const stableState = dynamicTracker.current.update(rawRecognition.state === "confirmed" ? rawRecognition.predictedLabel : null);
      setRecognition(applyDynamicConfirmation({ rawRecognition, stableState, requiredStableFrames }));
      return;
    }

    if (!model) {
      staticTracker.current.update(null);
      setRecognition(createNoModelResult(modelMessage));
      return;
    }
    const rawRecognition = recognizeLandmarks({
      model,
      landmarks: snapshot.landmarks,
      handCount: snapshot.handCount,
      handedness: snapshot.handedness,
    });
    const stableState = staticTracker.current.update(rawRecognition.state === "confirmed" ? rawRecognition.predictedLabel : null);
    setRecognition(applyStaticConfirmation({ rawRecognition, stableState, requiredStableFrames }));
  }, [addDynamicFrame, clearDynamicFrameBuffer, dynamicModel, dynamicModelMessage, isDynamicSign, model, modelMessage, requiredStableFrames, resetRecognition, snapshot]);

  return { recognition, resetRecognition, clearDynamicFrameBuffer };
}
