import { describe, expect, it } from "vitest";
import * as dynamicCapture from "../lib/dynamic-capture";

describe("dynamic recording state", () => {
  it("appends only while active and retains the latest frames", () => {
    const append = (dynamicCapture as typeof dynamicCapture & {
      appendDynamicFrame: (
        recording: { frame: never[]; confidence: number }[],
        active: boolean,
        frame: never[],
        confidence: number,
        maxFrames: number,
      ) => { frame: never[]; confidence: number }[];
    }).appendDynamicFrame;

    expect(typeof append).toBe("function");
    expect(append([], false, [], 0.5, 2)).toEqual([]);
    expect(append([
      { frame: [], confidence: 0.5 },
      { frame: [], confidence: 0.6 },
    ], true, [], 0.7, 2).map((item) => item.confidence)).toEqual([0.6, 0.7]);
  });
});

describe("guide quality state", () => {
  it("retains five snapshots and preserves dynamic quality rules", async () => {
    const guideQuality = await import("./use-guide-quality").catch(() => ({}));
    const advance = (guideQuality as {
      advanceGuideQuality?: (...args: never[]) => {
        history: unknown[];
        insideGuideFrame: boolean;
        steady: boolean;
        quality: { status: string; reasons: string[] };
      };
    }).advanceGuideQuality;
    const landmarks = [[{ x: 0.5, y: 0.5, z: 0 }]];
    let history: typeof landmarks[] = [];

    expect(typeof advance).toBe("function");
    for (let index = 0; index < 6; index += 1) {
      const state = advance!(history, {
        landmarks,
        handCount: 1,
        confidence: 1,
      }, 1, true);
      history = state.history as typeof history;
    }

    const state = advance!(history, {
      landmarks,
      handCount: 1,
      confidence: 1,
    }, 1, true);
    expect(state.history).toHaveLength(5);
    expect(state.insideGuideFrame).toBe(true);
    expect(state.steady).toBe(true);
    expect(state.quality).toEqual({ status: "clean", reasons: [] });
  });
});
