import { describe, expect, it } from "vitest";
import { createPredictionTracker, evaluatePrediction } from "./prediction";

describe("evaluatePrediction", () => {
  it("confirms high-confidence predictions", () => {
    expect(
      evaluatePrediction({
        predictions: [
          { label: "alphabet_A", confidence: 0.91 },
          { label: "alphabet_B", confidence: 0.42 },
        ],
      }).state,
    ).toBe("confirmed");
  });

  it("returns uncertain for medium-confidence predictions", () => {
    expect(
      evaluatePrediction({
        predictions: [{ label: "alphabet_A", confidence: 0.7 }],
      }).state,
    ).toBe("uncertain");
  });

  it("returns unknown below the low-confidence threshold", () => {
    expect(
      evaluatePrediction({
        predictions: [{ label: "alphabet_A", confidence: 0.58 }],
      }).state,
    ).toBe("unknown");
  });

  it("keeps only the highest-confidence prediction per label", () => {
    expect(
      evaluatePrediction({
        predictions: [
          { label: "alphabet_B", confidence: 0.82 },
          { label: "alphabet_A", confidence: 0.76 },
          { label: "alphabet_B", confidence: 0.61 },
          { label: "alphabet_C", confidence: 0.55 },
        ],
      }).topPredictions,
    ).toEqual([
      { label: "alphabet_B", confidence: 0.82 },
      { label: "alphabet_A", confidence: 0.76 },
      { label: "alphabet_C", confidence: 0.55 },
    ]);
  });
});

describe("createPredictionTracker", () => {
  it("requires five consecutive frames before stable confirmation", () => {
    const tracker = createPredictionTracker({ requiredFrames: 5 });

    for (let frame = 0; frame < 4; frame += 1) {
      expect(tracker.update("alphabet_A")).toEqual({
        label: "alphabet_A",
        count: frame + 1,
        stable: false,
      });
    }

    expect(tracker.update("alphabet_A")).toEqual({
      label: "alphabet_A",
      count: 5,
      stable: true,
    });
  });

  it("resets when the prediction changes", () => {
    const tracker = createPredictionTracker({ requiredFrames: 3 });

    tracker.update("alphabet_A");
    tracker.update("alphabet_A");

    expect(tracker.update("alphabet_B")).toEqual({
      label: "alphabet_B",
      count: 1,
      stable: false,
    });
  });
});
