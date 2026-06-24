export type ModelRuntimeInput = { kind: "static" | "dynamic"; features: number[] | number[][]; handCount: number };
export type ModelRuntimePrediction = { label: string | null; confidence: number; topPredictions: { label: string; confidence: number }[] };
export interface SignModelRuntime {
  readonly runtime: "knn" | "onnx" | "tfjs";
  load(): Promise<void>;
  predict(input: ModelRuntimeInput): Promise<ModelRuntimePrediction>;
}

