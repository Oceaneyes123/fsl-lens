import { describe, expect, it } from "vitest";
import { applyPredictionPolicy, defaultPredictionPolicy } from "./prediction-policy";

describe("prediction policy", () => {
  it("rejects low confidence and small top gaps", () => {
    const low = applyPredictionPolicy({ label: "A", confidence: 0.7, topPredictions: [{ label: "A", confidence: 0.7 }] }, defaultPredictionPolicy);
    const close = applyPredictionPolicy({ label: "A", confidence: 0.9, topPredictions: [{ label: "A", confidence: 0.9 }, { label: "B", confidence: 0.8 }] }, defaultPredictionPolicy);
    expect(low).toMatchObject({ label: null, uncertaintyReason: "low_confidence" });
    expect(close).toMatchObject({ label: null, uncertaintyReason: "small_top_gap" });
  });

  it("preserves confident predictions", () => {
    const result = { label: "A", confidence: 0.95, topPredictions: [{ label: "A", confidence: 0.95 }, { label: "B", confidence: 0.5 }] };
    expect(applyPredictionPolicy(result, defaultPredictionPolicy)).toEqual(result);
  });
});
