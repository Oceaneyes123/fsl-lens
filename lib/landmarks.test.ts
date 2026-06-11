import { describe, expect, it } from "vitest";
import { areLandmarksInsideGuideFrame, areLandmarksSteady, normalizeLandmarks } from "./landmarks";

const hand = Array.from({ length: 21 }, (_, index) => ({
  x: 0.4 + index * 0.005,
  y: 0.5 + index * 0.004,
  z: index * 0.001,
}));

describe("normalizeLandmarks", () => {
  it("returns stable vector lengths for one-hand and two-hand inputs", () => {
    expect(normalizeLandmarks([hand])).toHaveLength(63);
    expect(normalizeLandmarks([hand, hand])).toHaveLength(126);
  });

  it("normalizes coordinates relative to the wrist", () => {
    const vector = normalizeLandmarks([hand]);

    expect(vector[0]).toBe(0);
    expect(vector[1]).toBe(0);
    expect(vector[2]).toBe(0);
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
