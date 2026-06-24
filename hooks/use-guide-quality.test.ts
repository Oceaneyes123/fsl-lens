import { describe, expect, it } from "vitest";
import { advanceGuideQuality } from "../lib/dataset/guide-quality";

const hand = (offset = 0) => Array.from({ length: 21 }, (_, index) => ({
  x: 0.4 + offset + index * 0.001,
  y: 0.4 + index * 0.001,
  z: 0,
}));

describe("advanceGuideQuality", () => {
  it("keeps the latest five frames and reports guide, steady, and quality output", () => {
    const history = Array.from({ length: 5 }, (_, index) => [hand(index * 0.001)]);
    const result = advanceGuideQuality(history, { landmarks: [hand()], handCount: 1, confidence: 0.9 }, 1, false);
    expect(result.history).toEqual([...history.slice(-4), [hand()]]);
    expect(result).toMatchObject({ insideGuideFrame: true, steady: true, quality: { status: "clean" } });
  });

  it("does not require a dynamic sign to be steady", () => {
    const history = [[hand(-0.2)], [hand(0.2)]];
    const snapshot = { landmarks: [hand()], handCount: 1, confidence: 0.9 };
    expect(advanceGuideQuality(history, snapshot, 1, true).quality).toEqual({ status: "clean", reasons: [] });
    expect(advanceGuideQuality(history, snapshot, 1, false).quality.status).toBe("low_quality");
  });
});
