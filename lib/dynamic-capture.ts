import type { LandmarkFrame } from "./dynamic-landmarks";

export type RecordedDynamicFrame = {
  frame: LandmarkFrame;
  confidence: number;
};

export function createDynamicFrameBuffer({ maxFrames }: { maxFrames: number }) {
  let capturedFrames: LandmarkFrame[] = [];

  return {
    add(frame: LandmarkFrame) {
      capturedFrames = [...capturedFrames, frame].slice(-maxFrames);
    },
    clear() {
      capturedFrames = [];
    },
    frames() {
      return capturedFrames;
    },
  };
}

export function summarizeDynamicRecording(recording: RecordedDynamicFrame[]) {
  const frames = recording.map((item) => item.frame);
  const confidenceTotal = recording.reduce((sum, item) => sum + item.confidence, 0);

  return {
    frames,
    frameCount: frames.length,
    averageConfidence: frames.length > 0 ? roundFeature(confidenceTotal / frames.length) : 0,
  };
}

function roundFeature(value: number) {
  return Math.round(value * 1000000) / 1000000;
}
