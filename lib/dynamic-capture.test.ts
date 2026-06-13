import { describe, expect, it } from "vitest";
import { createDynamicFrameBuffer, summarizeDynamicRecording } from "./dynamic-capture";
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
    const summary = summarizeDynamicRecording([
      { frame: frame(0), confidence: 0.8 },
      { frame: frame(1), confidence: 1 },
    ]);

    expect(summary).toEqual({
      frames: [frame(0), frame(1)],
      frameCount: 2,
      averageConfidence: 0.9,
    });
  });
});
