import { describe, expect, it } from "vitest";
import { normalizeDynamicSequence, resampleLandmarkFrames } from "./dynamic-landmarks";
import type { NormalizedLandmark } from "./landmarks";

const hand = (offset: number): NormalizedLandmark[] =>
  Array.from({ length: 21 }, (_, index) => ({
    x: offset + index * 0.01,
    y: offset + index * 0.02,
    z: index * 0.001,
  }));

describe("dynamic landmark sequences", () => {
  it("resamples clips to a fixed frame count while preserving endpoints", () => {
    const frames = [[hand(0)], [hand(1)], [hand(2)]];

    const result = resampleLandmarkFrames(frames, 5);

    expect(result).toHaveLength(5);
    expect(result[0]).toBe(frames[0]);
    expect(result[2]).toBe(frames[1]);
    expect(result[4]).toBe(frames[2]);
  });

  it("normalizes resampled frame coordinates and appends motion deltas", () => {
    const vector = normalizeDynamicSequence([[hand(0)], [hand(0.2)]], { targetFrameCount: 2 });

    expect(vector).toHaveLength(2 * 21 * 3 * 2);
    expect(vector.slice(63, 126)).toEqual(Array(63).fill(0));
    expect(vector.slice(126).some((value) => value !== 0)).toBe(true);
  });

  it("returns an empty vector when there are no captured frames", () => {
    expect(normalizeDynamicSequence([], { targetFrameCount: 2 })).toEqual([]);
  });
});
