import type { RecognitionResult } from "./prediction-result";

export type ModelType = "static_knn" | "dynamic_sequence_knn" | "dynamic_lstm" | "dynamic_bilstm" | "dynamic_transformer";
export type StaticRecognitionInput = { kind: "static"; vector: number[]; handCount: number };
export type DynamicRecognitionInput = { kind: "dynamic"; sequence: number[][]; handCount: number; targetFrameCount: number };
export type SignClassifierInput = StaticRecognitionInput | DynamicRecognitionInput;

export interface SignClassifier {
  readonly modelType: ModelType;
  loadModel(model: unknown): void;
  predict(input: SignClassifierInput): RecognitionResult;
}
