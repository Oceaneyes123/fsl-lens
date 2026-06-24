import type { ModelRuntimePrediction } from "@/lib/models/model-runtime";

export type PredictionPolicyConfig = { minConfidence: number; minTopGap: number };
export const defaultPredictionPolicy: PredictionPolicyConfig = { minConfidence: 0.75, minTopGap: 0.15 };

export function applyPredictionPolicy(result: ModelRuntimePrediction, config: PredictionPolicyConfig): ModelRuntimePrediction & { uncertaintyReason?: "low_confidence" | "small_top_gap" } {
  if (result.confidence < config.minConfidence) return { ...result, label: null, uncertaintyReason: "low_confidence" };
  const gap = result.topPredictions.length > 1 ? result.topPredictions[0].confidence - result.topPredictions[1].confidence : 1;
  if (gap < config.minTopGap) return { ...result, label: null, uncertaintyReason: "small_top_gap" };
  return result;
}
