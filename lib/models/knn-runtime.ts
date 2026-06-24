import { DynamicSequenceKNNClassifier } from "../classifiers/dynamic-sequence-knn-classifier";
import { StaticKNNClassifier } from "../classifiers/static-knn-classifier";
import type { DynamicSequenceModel, KnnModel } from "./model-types";
import type { ModelRuntimeInput, SignModelRuntime } from "./model-runtime";

export class KnnRuntime implements SignModelRuntime {
  readonly runtime = "knn" as const;
  private readonly staticClassifier = new StaticKNNClassifier();
  private readonly dynamicClassifier = new DynamicSequenceKNNClassifier();

  constructor({ staticModel, dynamicModel }: { staticModel?: KnnModel; dynamicModel?: DynamicSequenceModel }) {
    if (staticModel) this.staticClassifier.loadModel(staticModel);
    if (dynamicModel) this.dynamicClassifier.loadModel(dynamicModel);
  }

  async load() {}

  async predict(input: ModelRuntimeInput) {
    const result = input.kind === "static"
      ? this.staticClassifier.predict({ kind: "static", vector: input.features as number[], handCount: input.handCount })
      : this.dynamicClassifier.predict({ kind: "dynamic", sequence: input.features as number[][], handCount: input.handCount, targetFrameCount: (input.features as number[][]).length });
    return { label: result.predictedLabel, confidence: result.confidence, topPredictions: result.topPredictions };
  }
}
