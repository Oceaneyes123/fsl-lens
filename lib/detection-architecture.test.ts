import { describe, expect, it } from "vitest";
import { normalizeDetectedHands } from "./landmark-extractor";
import { normalizeDynamicSequence, normalizeDynamicSequenceFrames, type LandmarkFrame } from "./dynamic-landmarks";
import { DynamicSequenceRecorder, SequenceBuffer } from "./dynamic-capture";
import { DynamicSequenceClassifier, type DynamicSequenceModel } from "./dynamic-recognition";
import { featureVersion, normalizeLandmarks, type NormalizedLandmark } from "./landmarks";
import { PredictionSmoother } from "./prediction";
import { StaticKNNClassifier, type KnnModel } from "./recognition";
import { DetectionModeRouter } from "./recognize-mode-recognition";

const hand = (offset = 0): NormalizedLandmark[] =>
  Array.from({ length: 21 }, (_, index) => ({
    x: offset + index * 0.01,
    y: offset + index * 0.02,
    z: index * 0.001,
  }));

const staticModel: KnnModel = {
  versionName: "static-test",
  featureVersion,
  thresholdConfig: { confirmThreshold: 0.8, uncertainThreshold: 0.6, requiredStableFrames: 2 },
  samples: [{ signLabel: "alphabet_A", handCount: 1, handedness: ["Right"], vector: normalizeLandmarks([hand()]) }],
};

function dynamicModel(frames: LandmarkFrame[]): DynamicSequenceModel {
  return {
    versionName: "dynamic-test",
    featureVersion,
    thresholdConfig: { confirmThreshold: 0.8, uncertainThreshold: 0.6, requiredStableSequences: 1 },
    sequenceConfig: { targetFrameCount: frames.length },
    samples: [{
      signLabel: "alphabet_J",
      handCount: 1,
      vector: normalizeDynamicSequence(frames, { targetFrameCount: frames.length }),
    }],
  };
}

describe("landmark extraction boundary", () => {
  it("zero-fills incomplete detected hands to 21 landmarks", () => {
    const hands = normalizeDetectedHands([[{ x: 0.1, y: 0.2, z: 0.3 }]]);

    expect(hands).toHaveLength(1);
    expect(hands[0]).toHaveLength(21);
    expect(hands[0][0]).toEqual({ x: 0.1, y: 0.2, z: 0.3 });
    expect(hands[0][20]).toEqual({ x: 0, y: 0, z: 0 });
  });
});

describe("classifier adapters", () => {
  it("preserves static KNN predictions from normalized frame features", () => {
    const classifier = new StaticKNNClassifier();
    classifier.loadModel(staticModel);

    expect(classifier.predict(normalizeLandmarks([hand()]), 1).predictedLabel).toBe("alphabet_A");
  });

  it("accepts dynamic input as sequence_length x feature_count", () => {
    const frames = [[hand(0)], [hand(0.2)]];
    const classifier = new DynamicSequenceClassifier();
    classifier.loadModel(dynamicModel(frames));

    expect(classifier.predict(normalizeDynamicSequenceFrames(frames), 1).predictedLabel).toBe("alphabet_J");
  });
});

describe("SequenceBuffer", () => {
  it("retains the latest frames and returns defensive copies", () => {
    const buffer = new SequenceBuffer(2);
    buffer.addFrame([1]);
    buffer.addFrame([2]);
    buffer.addFrame([3]);
    const sequence = buffer.getSequence();
    sequence[0][0] = 99;

    expect(buffer.isReady()).toBe(true);
    expect(buffer.getSequence()).toEqual([[2], [3]]);
    buffer.reset();
    expect(buffer.isReady()).toBe(false);
  });
});

describe("PredictionSmoother", () => {
  it("rejects low confidence and confirms a stable label", () => {
    const smoother = new PredictionSmoother({ confidenceThreshold: 0.8, stableCount: 2, historySize: 3 });

    expect(smoother.update({ label: "A", confidence: 0.7 }).stable).toBe(false);
    expect(smoother.update({ label: "A", confidence: 0.9 }).count).toBe(1);
    expect(smoother.update({ label: "A", confidence: 0.9 }).stable).toBe(true);
    smoother.reset();
    expect(smoother.update({ label: "A", confidence: 0.9 }).count).toBe(1);
  });
});

describe("DynamicSequenceRecorder", () => {
  it("keeps raw frames and exposes fixed-length normalized features", () => {
    const recorder = new DynamicSequenceRecorder(2);
    recorder.addFrame([hand(0)], 0.8);
    recorder.addFrame([hand(0.2)], 1);

    expect(recorder.getRawRecording()).toHaveLength(2);
    expect(recorder.getFeatureSequence()).toEqual(normalizeDynamicSequenceFrames([[hand(0)], [hand(0.2)]]));
  });
});

describe("DetectionModeRouter", () => {
  it("runs only the selected pipeline and resets dynamic readiness on mode changes", () => {
    const frames = [[hand(0)], [hand(0.2)]];
    const router = new DetectionModeRouter({ sequenceLength: 2 });
    router.loadStaticModel(staticModel);
    router.loadDynamicModel(dynamicModel(frames));

    expect(router.predict({ landmarks: frames[0], handCount: 1 }).predictedLabel).toBe("alphabet_A");
    router.setMode("dynamic");
    expect(router.predict({ landmarks: frames[0], handCount: 1 }).message).toContain("1/2");
    expect(router.predict({ landmarks: frames[1], handCount: 1 }).predictedLabel).toBe("alphabet_J");
    router.setMode("static");
    router.setMode("dynamic");
    expect(router.predict({ landmarks: frames[0], handCount: 1 }).message).toContain("1/2");
  });

  it("uses the loaded dynamic model sequence length by default", () => {
    const frames = [[hand(0)], [hand(0.2)]];
    const router = new DetectionModeRouter();
    router.loadDynamicModel(dynamicModel(frames));
    router.setMode("dynamic");

    router.predict({ landmarks: frames[0], handCount: 1 });
    expect(router.predict({ landmarks: frames[1], handCount: 1 }).predictedLabel).toBe("alphabet_J");
  });

  it("drops a partial dynamic sequence when tracking is lost", () => {
    const frames = [[hand(0)], [hand(0.2)]];
    const router = new DetectionModeRouter({ sequenceLength: 2 });
    router.loadDynamicModel(dynamicModel(frames));
    router.setMode("dynamic");

    router.predict({ landmarks: frames[0], handCount: 1 });
    router.predict(null);

    expect(router.predict({ landmarks: frames[1], handCount: 1 }).message).toContain("1/2");
  });

});
