import { describe, expect, it } from "vitest";
import { recognizeLandmarks, type KnnModel } from "./recognition";

const oneHand = Array.from({ length: 21 }, (_, index) => ({
  x: 0.4 + index * 0.005,
  y: 0.5 + index * 0.004,
  z: index * 0.001,
}));

const shiftedHand = oneHand.map((point) => ({ ...point, x: point.x + 0.04, y: point.y + 0.02 }));
const twoHands = [oneHand, shiftedHand];

const model: KnnModel = {
  versionName: "test-v1",
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
      vector: Array.from({ length: 63 }, () => 0),
    },
    {
      signLabel: "alphabet_B",
      handCount: 1,
      handedness: ["Right"],
      vector: Array.from({ length: 63 }, () => 0.7),
    },
    {
      signLabel: "number_10",
      handCount: 2,
      handedness: ["Left", "Right"],
      vector: Array.from({ length: 126 }, () => 0),
    },
  ],
};

describe("recognizeLandmarks", () => {
  it("returns top predictions sorted by confidence", () => {
    const result = recognizeLandmarks({
      model,
      landmarks: [oneHand],
      handCount: 1,
      handedness: ["Right"],
    });

    expect(result.topPredictions.map((prediction) => prediction.label)).toEqual(["alphabet_A", "alphabet_B"]);
    expect(result.topPredictions[0].confidence).toBeGreaterThan(result.topPredictions[1].confidence);
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
            vector: Array.from({ length: 63 }, () => 9),
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
});
