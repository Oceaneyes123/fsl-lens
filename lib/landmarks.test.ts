import { describe, expect, it } from "vitest";
import {
  areLandmarksInsideGuideFrame,
  areLandmarksSteady,
  computeFingerFeatures,
  featuresPerHand,
  fingerFeatureCount,
  normalizeLandmarks,
} from "./landmarks";

const hand = Array.from({ length: 21 }, (_, index) => ({
  x: 0.4 + index * 0.005,
  y: 0.5 + index * 0.004,
  z: index * 0.001,
}));

describe("normalizeLandmarks", () => {
  it("returns stable vector lengths for one-hand and two-hand inputs", () => {
    expect(normalizeLandmarks([hand])).toHaveLength(featuresPerHand);
    expect(normalizeLandmarks([hand, hand])).toHaveLength(featuresPerHand * 2);
  });

  it("normalizes coordinates relative to the wrist", () => {
    const vector = normalizeLandmarks([hand]);

    expect(vector[0]).toBe(0);
    expect(vector[1]).toBe(0);
    expect(vector[2]).toBe(0);
  });

  it("retains camera-relative wrist location", () => {
    const shifted = hand.map((point) => ({ ...point, x: point.x + 0.2, y: point.y - 0.1 }));
    const originalVector = normalizeLandmarks([hand]);
    const shiftedVector = normalizeLandmarks([shifted]);

    expect(originalVector.slice(-3, -1)).toEqual([0.4, 0.5]);
    expect(shiftedVector.slice(-3, -1)).toEqual([0.6, 0.4]);
  });

  it("uses stable left-to-right ordering for two hands", () => {
    const rightHand = hand.map((point) => ({ ...point, x: point.x + 0.3 }));

    expect(normalizeLandmarks([hand, rightHand])).toEqual(normalizeLandmarks([rightHand, hand]));
  });
});

describe("computeFingerFeatures", () => {
  it(`returns ${fingerFeatureCount} features per hand`, () => {
    const features = computeFingerFeatures(hand);
    expect(features).toHaveLength(fingerFeatureCount);
  });

  it("returns extension ratios close to 1 for a roughly straight hand", () => {
    const features = computeFingerFeatures(hand);

    // First 5 features are extension ratios
    for (let index = 0; index < 5; index += 1) {
      expect(features[index]).toBeGreaterThan(0.5);
    }
  });

  it("returns cosine angles between -1 and 1 for finger pairs", () => {
    const features = computeFingerFeatures(hand);

    // Last 4 features are cosine angles (with thumb-index added)
    for (let index = 5; index < fingerFeatureCount; index += 1) {
      expect(features[index]).toBeGreaterThanOrEqual(-1);
      expect(features[index]).toBeLessThanOrEqual(1);
    }
  });
});

describe("guide frame and stability", () => {
  it("detects landmarks outside the guide frame", () => {
    expect(areLandmarksInsideGuideFrame([hand])).toBe(true);
    expect(areLandmarksInsideGuideFrame([[{ ...hand[0], x: 0.02 }, ...hand.slice(1)]])).toBe(false);
  });

  it("marks recent landmark snapshots as steady only when movement stays small", () => {
    const steadyHistory = [
      [hand],
      [hand.map((point) => ({ ...point, x: point.x + 0.001 }))],
      [hand.map((point) => ({ ...point, x: point.x + 0.002 }))],
    ];
    const movingHistory = [
      [hand],
      [hand.map((point) => ({ ...point, x: point.x + 0.08 }))],
      [hand.map((point) => ({ ...point, x: point.x + 0.16 }))],
    ];

    expect(areLandmarksSteady(steadyHistory)).toBe(true);
    expect(areLandmarksSteady(movingHistory)).toBe(false);
  });
});
