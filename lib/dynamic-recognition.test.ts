import { describe, expect, it } from "vitest";
import { normalizeDynamicSequence } from "./dynamic-landmarks";
import { recognizeDynamicSequence, type DynamicSequenceModel } from "./dynamic-recognition";
import type { NormalizedLandmark } from "./landmarks";

const hand = (offset: number): NormalizedLandmark[] =>
  Array.from({ length: 21 }, (_, index) => ({
    x: offset + index * 0.01,
    y: offset + index * 0.02,
    z: index * 0.001,
  }));

const frames = (first: number, second: number) => [[hand(first)], [hand(second)]];

describe("dynamic sequence recognition", () => {
  it("predicts the nearest dynamic sequence sample", () => {
    const model: DynamicSequenceModel = {
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
        {
          signLabel: "alphabet_Z",
          handCount: 1,
          vector: normalizeDynamicSequence(frames(0.8, 0.1), { targetFrameCount: 2 }),
        },
      ],
    };

    const result = recognizeDynamicSequence({
      model,
      frames: frames(0, 0.2),
      handCount: 1,
    });

    expect(result.state).toBe("confirmed");
    expect(result.predictedLabel).toBe("alphabet_J");
  });

  it("returns unknown when motion is too small for the nearest dynamic sample", () => {
    const model: DynamicSequenceModel = {
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

    const result = recognizeDynamicSequence({
      model,
      frames: frames(0, 0.1),
      handCount: 1,
    });

    expect(result.state).toBe("unknown");
    expect(result.predictedLabel).toBeNull();
  });
});
