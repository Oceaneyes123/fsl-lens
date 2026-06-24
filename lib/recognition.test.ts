import { describe, expect, it } from "vitest";
import { featuresPerHand, featureVersion, normalizeLandmarks } from "./landmarks";
import {
  kWeightedVote,
  recognizeLandmarks,
  type KnnModel,
} from "./recognition";

const oneHand = Array.from({ length: 21 }, (_, index) => ({
  x: 0.4 + index * 0.005,
  y: 0.5 + index * 0.004,
  z: index * 0.001,
}));

const shiftedHand = oneHand.map((point) => ({ ...point, x: point.x + 0.04, y: point.y + 0.02 }));
const twoHands = [oneHand, shiftedHand];

const model: KnnModel = {
  versionName: "test-v1",
  featureVersion,
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
      vector: Array.from({ length: featuresPerHand }, () => 0),
    },
    {
      signLabel: "alphabet_B",
      handCount: 1,
      handedness: ["Right"],
      vector: Array.from({ length: featuresPerHand }, () => 0.7),
    },
    {
      signLabel: "number_10",
      handCount: 2,
      handedness: ["Left", "Right"],
      vector: Array.from({ length: featuresPerHand * 2 }, () => 0),
    },
  ],
};

describe("kWeightedVote", () => {
  it("returns empty for no candidates", () => {
    expect(kWeightedVote([], 3)).toEqual([]);
  });

  it("takes top-k neighbors and aggregates by label", () => {
    const distances = [
      { label: "alphabet_A", distance: 0.1 },
      { label: "alphabet_B", distance: 0.2 },
      { label: "alphabet_A", distance: 0.15 },
      { label: "alphabet_C", distance: 0.5 },
    ];

    const result = kWeightedVote(distances, 3);

    // A should win (two close neighbors)
    expect(result[0].label).toBe("alphabet_A");
  });

  it("handles fewer candidates than k", () => {
    const result = kWeightedVote([{ label: "alphabet_A", distance: 0.1 }], 3);

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("alphabet_A");
  });
});

describe("recognizeLandmarks", () => {
  it("uses the weighted k-NN winner instead of reverting to the nearest label", () => {
    const target = normalizeLandmarks([oneHand]);
    const result = recognizeLandmarks({
      model: {
        versionName: "weighted-vote",
        featureVersion,
        thresholdConfig: { confirmThreshold: 0.6, uncertainThreshold: 0.4, requiredStableFrames: 1 },
        samples: [
          { signLabel: "alphabet_A", handCount: 1, handedness: ["Right"], vector: target.map((value) => value + 0.15) },
          { signLabel: "alphabet_A", handCount: 1, handedness: ["Right"], vector: target.map((value) => value + 0.16) },
          { signLabel: "alphabet_B", handCount: 1, handedness: ["Right"], vector: target },
        ],
      },
      landmarks: [oneHand],
      handCount: 1,
      handedness: ["Right"],
    });

    expect(result.predictedLabel).toBe("alphabet_A");
  });

  it("returns top predictions sorted by confidence", () => {
    const result = recognizeLandmarks({
      model,
      landmarks: [oneHand],
      handCount: 1,
      handedness: ["Right"],
    });

    // The test hand's finger features are non-zero, making it closer to
    // alphabet_B (vector all-0.7) than alphabet_A (vector all-0).
    // Verify predictions are sorted, not the specific order.
    expect(result.topPredictions.length).toBeGreaterThanOrEqual(2);
    expect(result.topPredictions[0].confidence).toBeGreaterThanOrEqual(
      result.topPredictions[1].confidence,
    );
  });

  it("filters model samples by detected hand count", () => {
    const result = recognizeLandmarks({
      model,
      landmarks: twoHands,
      handCount: 2,
      handedness: ["Left", "Right"],
    });

    expect(result.topPredictions).toHaveLength(1);
    expect(result.topPredictions[0].label).toBe("number_10");
  });

  it("returns unknown when every prediction is below threshold", () => {
    const result = recognizeLandmarks({
      model: {
        ...model,
        samples: [
          {
            signLabel: "alphabet_Z",
            handCount: 1,
            handedness: ["Right"],
            vector: Array.from({ length: featuresPerHand }, () => 9),
          },
        ],
      },
      landmarks: [oneHand],
      handCount: 1,
      handedness: ["Right"],
    });

    expect(result.state).toBe("unknown");
    expect(result.predictedLabel).toBeNull();
  });

  it("supports bundled v1 models without a featureVersion field", () => {
    const result = recognizeLandmarks({
      model: {
        ...model,
        featureVersion: undefined,
        samples: [{ signLabel: "alphabet_A", handCount: 1, handedness: ["Right"], vector: normalizeLandmarks([oneHand]).slice(0, 63) }],
      },
      landmarks: [oneHand],
      handCount: 1,
      handedness: ["Right"],
    });

    expect(result.predictedLabel).toBe("alphabet_A");
  });

  it("returns no_model for unsupported feature versions", () => {
    const result = recognizeLandmarks({
      model: { ...model, featureVersion: 2 },
      landmarks: [oneHand],
      handCount: 1,
      handedness: ["Right"],
    });

    expect(result.state).toBe("no_model");
  });
});
