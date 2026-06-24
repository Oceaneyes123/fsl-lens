"use client";

import { useCallback, useState } from "react";
import { summarizeDynamicRecording, type RecordedDynamicFrame } from "@/lib/dynamic-capture";
import type { LandmarkFrame } from "@/lib/features/dynamic-sequence-features";

export function useDynamicRecording(maxFrames = 90) {
  const [recording, setRecording] = useState<RecordedDynamicFrame[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const start = useCallback(() => { setRecording([]); setIsRecording(true); }, []);
  const stop = useCallback(() => setIsRecording(false), []);
  const reset = useCallback(() => { setRecording([]); setIsRecording(false); }, []);
  const addFrame = useCallback((frame: LandmarkFrame, confidence: number) => setRecording((current) => isRecording ? [...current, { frame, confidence }].slice(-maxFrames) : current), [isRecording, maxFrames]);
  return { recording, isRecording, start, stop, reset, addFrame, summary: summarizeDynamicRecording(recording) };
}
