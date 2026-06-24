import { evaluatePrediction, euclideanDistance, distanceToConfidence, type Prediction } from "../prediction";
import { normalizeLandmarks, featuresPerHand, featureVersion, type NormalizedLandmark } from "../landmarks";
import type { SignClassifier, SignClassifierInput } from "../detection/classifier-types";
import { createIdleRecognitionResult, createNoModelResult, type RecognitionResult } from "../detection/prediction-result";
import type { KnnModel } from "../models/model-types";

const kNeighbors = 3;

export function recognizeLandmarks({ model, landmarks, handCount }: { model: KnnModel; landmarks: NormalizedLandmark[][]; handCount: number; handedness: string[] }): RecognitionResult {
  return recognizeStaticVector(model, normalizeLandmarks(landmarks), handCount);
}

function recognizeStaticVector(model: KnnModel, vector: number[], handCount: number): RecognitionResult {
  const modelVersion = model.featureVersion ?? 1;
  if (modelVersion !== 1 && modelVersion !== featureVersion) {
    return createNoModelResult(`Model version v${modelVersion} incompatible with runtime v${featureVersion}. Please retrain the model with: npm run train:model`);
  }
  const modelVector = modelVersion === 1 ? toLegacyStaticVector(vector, handCount) : vector;
  const candidates = model.samples.filter((sample) => sample.handCount === handCount && sample.vector.length === modelVector.length);
  if (candidates.length === 0) return createIdleRecognitionResult("No matching samples in the current model for this hand configuration.");
  const predictions = kWeightedVote(candidates.map((sample) => ({ label: sample.signLabel, distance: euclideanDistance(modelVector, sample.vector) })), kNeighbors);
  const evaluation = evaluatePrediction({ predictions, confirmThreshold: model.thresholdConfig.confirmThreshold, uncertainThreshold: model.thresholdConfig.uncertainThreshold, preserveOrder: true });
  return { state: evaluation.state, predictedLabel: evaluation.state === "unknown" ? null : (evaluation.topPredictions[0]?.label ?? null), confidence: evaluation.topPredictions[0]?.confidence ?? 0, topPredictions: evaluation.topPredictions, stable: false, stableFrameCount: 0, message: evaluation.message };
}

function toLegacyStaticVector(vector: number[], handCount: number) {
  if (vector.length !== handCount * featuresPerHand) return vector;
  return Array.from({ length: handCount }, (_, index) => vector.slice(index * featuresPerHand, index * featuresPerHand + 63)).flat();
}

export class StaticKNNClassifier implements SignClassifier {
  readonly modelType = "static_knn" as const;
  private model: KnnModel | null = null;
  loadModel(model: unknown) { this.model = model as KnnModel; }
  predict(input: SignClassifierInput): RecognitionResult;
  predict(vector: number[], handCount: number): RecognitionResult;
  predict(input: SignClassifierInput | number[], handCount?: number) {
    const vector = Array.isArray(input) ? input : input.kind === "static" ? input.vector : [];
    const count = Array.isArray(input) ? (handCount ?? 0) : input.handCount;
    return this.model ? recognizeStaticVector(this.model, vector, count) : createNoModelResult();
  }
}

export function kWeightedVote(distances: { label: string; distance: number }[], k: number): Prediction[] {
  const neighbors = [...distances].sort((a, b) => a.distance - b.distance).slice(0, Math.min(k, distances.length));
  const weightByLabel = new Map<string, number>();
  const bestDistanceByLabel = new Map<string, number>();
  for (const { label, distance } of neighbors) {
    weightByLabel.set(label, (weightByLabel.get(label) ?? 0) + 1 / (1 + distance * distance));
    bestDistanceByLabel.set(label, Math.min(bestDistanceByLabel.get(label) ?? Number.POSITIVE_INFINITY, distance));
  }
  return Array.from(weightByLabel).sort((left, right) => right[1] - left[1]).map(([label]) => ({ label, confidence: distanceToConfidence(bestDistanceByLabel.get(label) ?? Number.POSITIVE_INFINITY) }));
}

export { createIdleRecognitionResult, createNoModelResult, distanceToConfidence };
export type { KnnModel, ModelSample } from "../models/model-types";
export type { RecognitionResult } from "../detection/prediction-result";
