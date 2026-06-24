import { describe, expect, it } from "vitest";
import { normalizeDynamicSequence } from "./dynamic-landmarks";
import { featureVersion } from "./landmarks";
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
  it("rejects an incompatible feature version", () => {
    const model: DynamicSequenceModel = {
      versionName: "old-dynamic",
      featureVersion: featureVersion - 1,
      thresholdConfig: { confirmThreshold: 0.8, uncertainThreshold: 0.6, requiredStableSequences: 2 },
      sequenceConfig: { targetFrameCount: 2 },
      samples: [],
    };

    expect(recognizeDynamicSequence({ model, frames: frames(0, 0.2), handCount: 1 })).toMatchObject({
      state: "no_model",
      predictedLabel: null,
    });
  });

  it("supports bundled v1 dynamic models", () => {
    const movingFrames = frames(0, 0.2);
    const currentVector = normalizeDynamicSequence(movingFrames, { targetFrameCount: 2 });
    const legacyVector = currentVector.flatMap((_, index) => index % 138 < 63 || index % 138 >= 75 ? [currentVector[index]] : []);
    const model: DynamicSequenceModel = {
      versionName: "legacy-dynamic",
      thresholdConfig: { confirmThreshold: 0.8, uncertainThreshold: 0.6, requiredStableSequences: 1 },
      sequenceConfig: { targetFrameCount: 2 },
      samples: [{ signLabel: "alphabet_J", handCount: 1, vector: legacyVector }],
    };

    expect(recognizeDynamicSequence({ model, frames: movingFrames, handCount: 1 }).predictedLabel).toBe("alphabet_J");
  });
  it("predicts the nearest dynamic sequence sample", () => {
    const model: DynamicSequenceModel = {
      versionName: "test-dynamic",
      featureVersion,
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

  it("returns unknown when motion is incompatible with every dynamic sample", () => {
    // Model has a sample with clear movement (hand(0) → hand(0.2))
    const model: DynamicSequenceModel = {
      versionName: "test-dynamic",
      featureVersion,
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

    // Input has completely different hand count — no candidates match
    const result = recognizeDynamicSequence({
      model,
      frames: frames(0, 0.2),
      handCount: 2,
    });

    expect(result.state).toBe("unknown");
    expect(result.predictedLabel).toBeNull();
  });

  it("rejects motion that is much smaller than the trained sequence", () => {
    const model: DynamicSequenceModel = {
      versionName: "test-dynamic",
      featureVersion,
      thresholdConfig: { confirmThreshold: 0.8, uncertainThreshold: 0.6, requiredStableSequences: 2 },
      sequenceConfig: { targetFrameCount: 2 },
      samples: [{ signLabel: "alphabet_J", handCount: 1, vector: normalizeDynamicSequence(frames(0, 0.2), { targetFrameCount: 2 }) }],
    };

    expect(recognizeDynamicSequence({ model, frames: frames(0, 0.01), handCount: 1 }).state).toBe("unknown");
  });
});
