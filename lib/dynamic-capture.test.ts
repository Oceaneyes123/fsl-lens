import { describe, expect, it } from "vitest";
import { appendDynamicFrame, createDynamicFrameBuffer, summarizeDynamicRecording } from "./dynamic-capture";
import type { LandmarkFrame } from "./dynamic-landmarks";

const frame = (offset: number): LandmarkFrame => [
  Array.from({ length: 21 }, (_, index) => ({
    x: offset + index * 0.01,
    y: offset + index * 0.01,
    z: 0,
  })),
];

describe("dynamic capture helpers", () => {
  it("keeps the latest frames for rolling dynamic recognition", () => {
    const buffer = createDynamicFrameBuffer({ maxFrames: 3 });
    buffer.add(frame(0));
    buffer.add(frame(1));
    buffer.add(frame(2));
    buffer.add(frame(3));
    expect(buffer.frames()).toEqual([frame(1), frame(2), frame(3)]);
  });

  it("summarizes a dynamic recording with frame count and average confidence", () => {
    expect(summarizeDynamicRecording([
      { frame: frame(0), confidence: 0.8 },
      { frame: frame(1), confidence: 1 },
    ])).toEqual({ frames: [frame(0), frame(1)], frameCount: 2, averageConfidence: 0.9 });
  });

  it("returns the original recording while inactive", () => {
    const recording = [{ frame: frame(0), confidence: 0.8 }];
    expect(appendDynamicFrame(recording, false, frame(1), 0.9, 2)).toBe(recording);
  });

  it("appends without mutation and retains only the latest frames", () => {
    const recording = [{ frame: frame(0), confidence: 0.8 }];
    const next = appendDynamicFrame(recording, true, frame(1), 0.9, 1);
    expect(next).toEqual([{ frame: frame(1), confidence: 0.9 }]);
    expect(next).not.toBe(recording);
    expect(recording).toEqual([{ frame: frame(0), confidence: 0.8 }]);
  });
});
