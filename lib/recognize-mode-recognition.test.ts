import { describe, expect, it } from "vitest";
import { normalizeDynamicSequence } from "./dynamic-landmarks";
import { normalizeLandmarks } from "./landmarks";
import { recognizeVisibleSign } from "./recognize-mode-recognition";
import type { DynamicSequenceModel } from "./dynamic-recognition";
import type { NormalizedLandmark } from "./landmarks";
import type { KnnModel } from "./recognition";

const hand = (offset: number): NormalizedLandmark[] =>
  Array.from({ length: 21 }, (_, index) => ({
    x: offset + index * 0.01,
    y: offset + index * 0.02,
    z: index * 0.001,
  }));

const frames = (first: number, second: number) => [[hand(first)], [hand(second)]];

const staticModel: KnnModel = {
  versionName: "test-static",
  thresholdConfig: {
    confirmThreshold: 0.8,
    uncertainThreshold: 0.6,
    requiredStableFrames: 5,
  },
  samples: [
    {
      signLabel: "alphabet_A",
      handCount: 1,
      handedness: ["Right"],
      vector: normalizeLandmarks([hand(0)]),
    },
  ],
};

const dynamicModel: DynamicSequenceModel = {
  versionName: "test-dynamic",
  thresholdConfig: {
    confirmThreshold: 0.8,
    uncertainThreshold: 0.6,
    requiredStableSequences: 2,
  },
  sequenceConfig: {
    targetFrameCount: 2,
  },
  samples: [
    {
      signLabel: "alphabet_J",
      handCount: 1,
      vector: normalizeDynamicSequence(frames(0, 0.2), { targetFrameCount: 2 }),
    },
  ],
};

describe("recognizeVisibleSign", () => {
  it("prefers confirmed dynamic signs over static predictions in recognize mode", () => {
    const result = recognizeVisibleSign({
      model: staticModel,
      dynamicModel,
      landmarks: frames(0, 0.2)[1],
      dynamicFrames: frames(0, 0.2),
      handCount: 1,
      handedness: ["Right"],
    });

    expect(result.state).toBe("confirmed");
    expect(result.predictedLabel).toBe("alphabet_J");
  });

  it("keeps the static prediction when no dynamic sequence is confirmed", () => {
    const result = recognizeVisibleSign({
      model: staticModel,
      dynamicModel: null,
      landmarks: [hand(0)],
      dynamicFrames: [frames(0, 0.2)[0]],
      handCount: 1,
      handedness: ["Right"],
    });

    expect(result.predictedLabel).toBe("alphabet_A");
  });

  it("keeps the static prediction when the dynamic buffer has no meaningful motion", () => {
    const result = recognizeVisibleSign({
      model: staticModel,
      dynamicModel,
      landmarks: [hand(0)],
      dynamicFrames: frames(0, 0),
      handCount: 1,
      handedness: ["Right"],
    });

    expect(result.predictedLabel).toBe("alphabet_A");
  });

  it("keeps a stronger static prediction when non-J motion partially matches J", () => {
    const result = recognizeVisibleSign({
      model: staticModel,
      dynamicModel,
      landmarks: [hand(0.1)],
      dynamicFrames: frames(0, 0.1),
      handCount: 1,
      handedness: ["Right"],
    });

    expect(result.predictedLabel).toBe("alphabet_A");
  });
});
