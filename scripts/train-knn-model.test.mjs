import { describe, expect, test } from "vitest";
import { distance, fetchCleanSamples, normalizeLandmarks, predictWeightedKnn } from "./train-knn-model.mjs";

// Feature sizes — keep in sync with train-knn-model.mjs
const FINGER_FEATURE_COUNT = 9;
const LOCATION_FEATURE_COUNT = 3;
const FEATURES_PER_LANDMARK = 3;

describe("train-knn-model helpers", () => {
  test("normalizes each hand relative to its wrist and hand scale", () => {
    const vector = normalizeLandmarks([
      [
        { x: 1, y: 1, z: 1 },
        { x: 3, y: 1, z: 1 },
      ],
    ]);

    // 2 landmarks × 3 values + 9 finger features + 3 wrist-location features
    const expectedLength = 2 * FEATURES_PER_LANDMARK + FINGER_FEATURE_COUNT + LOCATION_FEATURE_COUNT;

    expect(vector).toHaveLength(expectedLength);
    expect(vector[0]).toBe(0); // wrist x
    expect(vector[1]).toBe(0); // wrist y
    expect(vector[2]).toBe(0); // wrist z
    expect(vector[3]).toBe(1); // next point, x range
  });

  test("predicts the nearest sample with matching hand count and vector size", () => {
    const sampleVector = [0, 0, 0, ...Array(FINGER_FEATURE_COUNT).fill(0)];
    const farVector = [0.9, 0.9, 0.9, ...Array(FINGER_FEATURE_COUNT).fill(0.9)];

    const result = predictWeightedKnn(
      [
        { id: "a", signLabel: "alphabet_A", handCount: 1, vector: sampleVector },
        { id: "b", signLabel: "alphabet_B", handCount: 1, vector: farVector },
        { id: "c", signLabel: "alphabet_C", handCount: 2, vector: [...sampleVector, ...sampleVector] },
      ],
      { handCount: 1, vector: [1, 1, 1, ...Array(FINGER_FEATURE_COUNT).fill(0.05)] },
    );

    expect(result?.label).toBe("alphabet_A");
  });

  test("computes root mean square euclidean distance", () => {
    expect(distance([1, 1, 1], [2, 2, 2])).toBe(1);
  });

  test("fetches clean samples across multiple Supabase pages", async () => {
    const pages = [
      [{ id: "number_4_a" }, { id: "number_4_b" }],
      [{ id: "number_9_a" }],
    ];
    const ranges = [];
    const supabase = {
      from() {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          order() {
            return this;
          },
          async range(from, to) {
            ranges.push([from, to]);
            return { data: pages.shift() ?? [], error: null };
          },
        };
      },
    };

    const result = await fetchCleanSamples(supabase, { pageSize: 2 });

    expect(result.map((row) => row.id)).toEqual(["number_4_a", "number_4_b", "number_9_a"]);
    expect(ranges).toEqual([
      [0, 1],
      [2, 3],
    ]);
  });
});
