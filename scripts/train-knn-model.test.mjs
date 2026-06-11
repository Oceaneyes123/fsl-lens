import { describe, expect, test } from "vitest";
import { distance, normalizeLandmarks, predictNearest } from "./train-knn-model.mjs";

describe("train-knn-model helpers", () => {
  test("normalizes each hand relative to its wrist and hand scale", () => {
    const vector = normalizeLandmarks([
      [
        { x: 1, y: 1, z: 1 },
        { x: 3, y: 1, z: 1 },
      ],
    ]);

    expect(vector).toEqual([0, 0, 0, 1, 0, 0]);
  });

  test("predicts the nearest sample with matching hand count and vector size", () => {
    const result = predictNearest(
      [
        { id: "a", signLabel: "alphabet_A", handCount: 1, vector: [0, 0, 0] },
        { id: "b", signLabel: "alphabet_B", handCount: 1, vector: [0.9, 0.9, 0.9] },
        { id: "c", signLabel: "alphabet_C", handCount: 2, vector: [0, 0, 0, 0, 0, 0] },
      ],
      { handCount: 1, vector: [1, 1, 1] },
    );

    expect(result?.label).toBe("alphabet_B");
  });

  test("computes root mean square euclidean distance", () => {
    expect(distance([1, 1, 1], [2, 2, 2])).toBe(1);
  });
});
