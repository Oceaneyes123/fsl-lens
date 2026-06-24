"use client";

import { useCallback, useState } from "react";
import { appendDynamicFrame, summarizeDynamicRecording, type RecordedDynamicFrame } from "@/lib/dynamic-capture";
import type { LandmarkFrame } from "@/lib/features/dynamic-sequence-features";

export function useDynamicRecording({ maxFrames = 90 } = {}) {
  const [recording, setRecording] = useState<RecordedDynamicFrame[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const start = useCallback(() => { setRecording([]); setIsRecording(true); }, []);
  const stop = useCallback(() => setIsRecording(false), []);
  const reset = useCallback(() => { setRecording([]); setIsRecording(false); }, []);
  const addFrame = useCallback((frame: LandmarkFrame, confidence: number) => setRecording((current) => appendDynamicFrame(current, isRecording, frame, confidence, maxFrames)), [isRecording, maxFrames]);
  const summarize = useCallback(() => summarizeDynamicRecording(recording), [recording]);
  return { recording, isRecording, start, stop, reset, addFrame, summarize };
}
