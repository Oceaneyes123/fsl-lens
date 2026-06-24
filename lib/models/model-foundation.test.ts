import { describe, expect, it } from "vitest";
import { KnnRuntime } from "./knn-runtime";
import { NeuralRuntimePlaceholder } from "./neural-runtime";
import { selectActiveModelManifest, validateModelManifest } from "./model-registry";
import type { ModelManifest } from "./model-manifest";

const active: ModelManifest = { modelId: "m1", versionName: "v1", modelType: "static_knn", runtime: "knn", supportedSigns: ["A"], featureSchemaVersion: "hand_v1", landmarkSchemaVersion: "hand_v1", status: "active" };

describe("model foundation", () => {
  it("selects only an active matching manifest", () => {
    expect(selectActiveModelManifest([{ ...active, status: "archived" }, active], "static_knn")).toEqual(active);
    expect(selectActiveModelManifest([{ ...active, status: "candidate" }], "static_knn")).toBeNull();
  });

  it("validates manifests", () => {
    expect(validateModelManifest(active)).toEqual({ valid: true, errors: [] });
    expect(validateModelManifest({ ...active, modelId: "", supportedSigns: [] }).valid).toBe(false);
  });

  it("wraps existing static and dynamic KNN classifiers", async () => {
    const staticModel = { versionName: "v1", thresholdConfig: { confirmThreshold: 0.5, uncertainThreshold: 0.2, requiredStableFrames: 1 }, samples: [{ signLabel: "A", handCount: 1, handedness: ["Right"], vector: [0, 0, 0] }] };
    const dynamicModel = { versionName: "v1", thresholdConfig: { confirmThreshold: 0.5, uncertainThreshold: 0.2, requiredStableSequences: 1 }, sequenceConfig: { targetFrameCount: 2 }, samples: [{ signLabel: "J", handCount: 1, vector: [0, 0, 0, 0] }] };
    const runtime = new KnnRuntime({ staticModel, dynamicModel });
    await runtime.load();
    expect((await runtime.predict({ kind: "static", features: [0, 0, 0], handCount: 1 })).label).toBe("A");
    expect((await runtime.predict({ kind: "dynamic", features: [[0, 0], [0, 0]], handCount: 1 })).topPredictions).toBeInstanceOf(Array);
  });

  it("fails safely when a neural runtime is unavailable", async () => {
    const runtime = new NeuralRuntimePlaceholder("onnx");
    await expect(runtime.load()).resolves.toBeUndefined();
    await expect(runtime.predict({ kind: "static", features: [], handCount: 0 })).resolves.toEqual({ label: null, confidence: 0, topPredictions: [] });
  });
});

