import { describe, expect, it } from "vitest";
import { fromHandOnlySnapshot } from "./holistic-landmark-schema";
import { flattenHolisticSequence, resampleHolisticSequence } from "./holistic-sequence-features";

const point = { x: 0.1, y: 0.2, z: 0.3 };

describe("holistic v2 features", () => {
  it("converts hand-only snapshots and zero-fills missing landmarks", () => {
    const frame = fromHandOnlySnapshot({ landmarks: [[point]], handCount: 1, handedness: ["Right"], confidence: 0.9 });
    expect(frame.rightHand[0]).toEqual(point);
    expect(frame.rightHand).toHaveLength(21);
    expect(frame.leftHand).toHaveLength(21);
    expect(frame.leftHand.every((landmark) => landmark.x === 0 && landmark.y === 0 && landmark.z === 0)).toBe(true);
    expect(frame.pose).toHaveLength(33);
    expect(frame.missing.leftHand).toBe(true);
  });

  it("resamples to a fixed frame count and keeps flattened lengths stable", () => {
    const first = fromHandOnlySnapshot({ landmarks: [[point]], handCount: 1, handedness: ["Right"], confidence: 0.9 });
    const last = fromHandOnlySnapshot({ landmarks: [[{ x: 0.9, y: 0.8, z: 0.7 }]], handCount: 1, handedness: ["Right"], confidence: 0.8 });
    const sequence = { schemaVersion: "holistic_v2" as const, frames: [first, last], fps: 15 };
    const resampled = resampleHolisticSequence(sequence, 5);
    expect(resampled.frames).toHaveLength(5);
    expect(resampled.fps).toBe(15);
    expect(flattenHolisticSequence(resampled)).toHaveLength(flattenHolisticSequence({ ...sequence, frames: [first, first, first, first, first] }).length);
  });
});

