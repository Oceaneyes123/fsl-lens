import type { ModelRuntimeInput, SignModelRuntime } from "./model-runtime";

export class NeuralRuntimePlaceholder implements SignModelRuntime {
  constructor(readonly runtime: "onnx" | "tfjs") {}
  async load() {}
  async predict(_input: ModelRuntimeInput) { return { label: null, confidence: 0, topPredictions: [] }; }
}

