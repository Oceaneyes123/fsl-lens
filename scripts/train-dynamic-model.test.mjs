import { describe, expect, it } from "vitest";
import { createUsableDynamicSamples, normalizeDynamicSequence, predictNearestSequence } from "./train-dynamic-model.mjs";

// Feature sizes — keep in sync with train-dynamic-model.mjs
const VALUES_PER_LANDMARK = 3;
const FINGER_FEATURE_COUNT = 9;
const LOCATION_FEATURE_COUNT = 3;
const FEATURES_PER_HAND = 21 * VALUES_PER_LANDMARK + FINGER_FEATURE_COUNT + LOCATION_FEATURE_COUNT; // 75
const DELTAS_PER_HAND = 21 * VALUES_PER_LANDMARK; // 63

const hand = (offset) =>
  Array.from({ length: 21 }, (_, index) => ({
    x: offset + index * 0.01,
    y: offset + index * 0.02,
    z: index * 0.001,
  }));

const frames = (first, second) => [[hand(first)], [hand(second)]];

describe("train-dynamic-model helpers", () => {
  it("creates usable sequence samples from clean reviewed dynamic rows", () => {
    const samples = createUsableDynamicSamples([
      {
        id: "sample-1",
        sign_id: "alphabet_J",
        hand_count: 1,
        frames_json: frames(0, 0.2),
        frame_count: 2,
        fps: 15,
        quality_status: "clean",
        review_status: "approved",
        detector_confidence: 0.95,
      },
    ]);

    expect(samples).toHaveLength(1);
    expect(samples[0].signLabel).toBe("alphabet_J");
    // Each frame: FEATURES_PER_HAND (normalized) + DELTAS_PER_HAND (raw deltas)
    // Default targetFrameCount = 30
    expect(samples[0].vector).toHaveLength(30 * (FEATURES_PER_HAND + DELTAS_PER_HAND));
  });

  it("predicts the nearest normalized sequence with matching hand count", () => {
    const samples = [
      {
        id: "j",
        signLabel: "alphabet_J",
        handCount: 1,
        vector: normalizeDynamicSequence(frames(0, 0.2)),
      },
      {
        id: "z",
        signLabel: "alphabet_Z",
        handCount: 1,
        vector: normalizeDynamicSequence(frames(0.8, 0.1)),
      },
    ];

    const result = predictNearestSequence(samples, {
      id: "target",
      signLabel: "alphabet_J",
      handCount: 1,
      vector: normalizeDynamicSequence(frames(0, 0.2)),
    });

    expect(result?.label).toBe("alphabet_J");
  });
});
