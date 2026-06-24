import { normalizeDynamicSequenceFrames, type LandmarkFrame } from "./dynamic-landmarks";

export type RecordedDynamicFrame = {
  frame: LandmarkFrame;
  confidence: number;
};

export function appendDynamicFrame(
  recording: RecordedDynamicFrame[],
  active: boolean,
  frame: LandmarkFrame,
  confidence: number,
  maxFrames: number,
) {
  return active ? [...recording, { frame, confidence }].slice(-maxFrames) : recording;
}

export class SequenceBuffer {
  private values: number[][] = [];

  constructor(private readonly sequenceLength: number) {
    if (sequenceLength <= 0) throw new Error("Sequence length must be positive.");
  }

  addFrame(features: number[]) {
    this.values = [...this.values, [...features]].slice(-this.sequenceLength);
  }

  isReady() {
    return this.values.length === this.sequenceLength;
  }

  getSequence() {
    return this.values.map((features) => [...features]);
  }

  reset() {
    this.values = [];
  }
}

export class DynamicSequenceRecorder {
  private recording: RecordedDynamicFrame[] = [];

  constructor(private readonly sequenceLength: number) {}

  addFrame(frame: LandmarkFrame, confidence: number) {
    this.recording = [...this.recording, { frame, confidence }].slice(-this.sequenceLength);
  }

  getRawRecording() {
    return [...this.recording];
  }

  getFeatureSequence() {
    return normalizeDynamicSequenceFrames(this.recording.map((item) => item.frame), {
      targetFrameCount: this.sequenceLength,
    });
  }

  reset() {
    this.recording = [];
  }
}

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
