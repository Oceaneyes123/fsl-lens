import { describe, expect, it } from "vitest";
import { validateSampleQuality } from "./sample-quality";

describe("validateSampleQuality", () => {
  it("accepts a steady sample with matching hand count and strong confidence", () => {
    expect(
      validateSampleQuality({
        detectedHandCount: 1,
        expectedHandCount: 1,
        detectorConfidence: 0.86,
        landmarksVisible: true,
        insideGuideFrame: true,
        steady: true,
      }),
    ).toEqual({ status: "clean", reasons: [] });
  });

  it("rejects samples with the wrong hand count", () => {
    expect(
      validateSampleQuality({
        detectedHandCount: 2,
        expectedHandCount: 1,
        detectorConfidence: 0.9,
        landmarksVisible: true,
        insideGuideFrame: true,
        steady: true,
      }).status,
    ).toBe("rejected");
  });

  it("marks borderline confidence as low quality", () => {
    expect(
      validateSampleQuality({
        detectedHandCount: 1,
        expectedHandCount: 1,
        detectorConfidence: 0.72,
        landmarksVisible: true,
        insideGuideFrame: true,
        steady: true,
      }).status,
    ).toBe("low_quality");
  });
});
