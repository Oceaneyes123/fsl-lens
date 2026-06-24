import { normalizeDynamicSequence, type LandmarkFrame } from "../features/dynamic-sequence-features";
import { featuresPerHand, featureVersion } from "../features/feature-version";
import { evaluatePrediction, euclideanDistance, type Prediction, type PredictionState } from "../prediction";
import { kWeightedVote } from "./static-knn-classifier";
import type { SignClassifier, SignClassifierInput } from "../detection/classifier-types";
import { createNoModelResult, type RecognitionResult } from "../detection/prediction-result";
import type { DynamicModelSample, DynamicSequenceModel } from "../models/model-types";

const kNeighbors = 3;
export type DynamicRecognitionResult = { state: PredictionState | "no_model"; predictedLabel: string | null; confidence: number; topPredictions: Prediction[]; message: string };

export function recognizeDynamicSequence({ model, frames, handCount }: { model: DynamicSequenceModel; frames: LandmarkFrame[]; handCount: number }): DynamicRecognitionResult {
  return recognizeDynamicVector(model, normalizeDynamicSequence(frames, { targetFrameCount: model.sequenceConfig.targetFrameCount }), handCount);
}

function recognizeDynamicVector(model: DynamicSequenceModel, vector: number[], handCount: number): DynamicRecognitionResult {
  const modelVersion = model.featureVersion ?? 1;
  if (modelVersion !== 1 && modelVersion !== featureVersion) return { state: "no_model", predictedLabel: null, confidence: 0, topPredictions: [], message: `Dynamic model version v${modelVersion} incompatible with runtime v${featureVersion}. Please retrain the model with: npm run train:dynamic-model` };
  const modelVector = modelVersion === 1 ? toLegacyDynamicVector(vector, model.sequenceConfig.targetFrameCount, handCount) : vector;
  const sequenceMotion = calculateSequenceMotion(modelVector, model.sequenceConfig.targetFrameCount, modelVersion);
  const candidates = model.samples.filter((sample) => sample.handCount === handCount && sample.vector.length === modelVector.length && hasComparableMotion(sequenceMotion, sample.vector, model.sequenceConfig.targetFrameCount, modelVersion));
  if (candidates.length === 0) return { state: "unknown", predictedLabel: null, confidence: 0, topPredictions: [], message: "No matching dynamic samples for this motion profile." };
  const predictions = kWeightedVote(candidates.map((sample) => ({ label: sample.signLabel, distance: euclideanDistance(modelVector, sample.vector) })), kNeighbors);
  const evaluation = evaluatePrediction({ predictions, confirmThreshold: model.thresholdConfig.confirmThreshold, uncertainThreshold: model.thresholdConfig.uncertainThreshold, preserveOrder: true });
  return { state: evaluation.state, predictedLabel: evaluation.state === "unknown" ? null : (evaluation.topPredictions[0]?.label ?? null), confidence: evaluation.topPredictions[0]?.confidence ?? 0, topPredictions: evaluation.topPredictions, message: evaluation.message };
}

function toLegacyDynamicVector(vector: number[], targetFrameCount: number, handCount: number) {
  const frameSize = handCount * (featuresPerHand + 63);
  if (vector.length !== targetFrameCount * frameSize) return vector;
  return Array.from({ length: targetFrameCount }, (_, frameIndex) => {
    const frame = vector.slice(frameIndex * frameSize, (frameIndex + 1) * frameSize);
    const positions = Array.from({ length: handCount }, (_, handIndex) => frame.slice(handIndex * featuresPerHand, handIndex * featuresPerHand + 63)).flat();
    return [...positions, ...frame.slice(handCount * featuresPerHand)];
  }).flat();
}

export class DynamicSequenceKNNClassifier implements SignClassifier {
  readonly modelType = "dynamic_sequence_knn" as const;
  private model: DynamicSequenceModel | null = null;
  loadModel(model: unknown) { this.model = model as DynamicSequenceModel; }
  predict(input: SignClassifierInput): RecognitionResult;
  predict(sequence: number[][], handCount: number): RecognitionResult;
  predict(input: SignClassifierInput | number[][], handCount?: number) {
    const sequence = Array.isArray(input) ? input : input.kind === "dynamic" ? input.sequence : [];
    const count = Array.isArray(input) ? (handCount ?? 0) : input.handCount;
    if (!this.model) return createNoModelResult("No active dynamic recognition model is loaded yet.");
    return { ...recognizeDynamicVector(this.model, sequence.flat(), count), stable: false, stableFrameCount: 0 };
  }
}

export { DynamicSequenceKNNClassifier as DynamicSequenceClassifier };
export type { DynamicModelSample, DynamicSequenceModel } from "../models/model-types";

function hasComparableMotion(sequenceMotion: number, sampleVector: number[], targetFrameCount: number, modelVersion: number) {
  const sampleMotion = calculateSequenceMotion(sampleVector, targetFrameCount, modelVersion);
  return sampleMotion > 0 && sequenceMotion >= Math.max(0.002, sampleMotion * 0.65) && sequenceMotion <= sampleMotion * 1.6;
}
function calculateSequenceMotion(vector: number[], targetFrameCount: number, modelVersion: number) {
  if (targetFrameCount <= 0 || vector.length === 0) return 0;
  const featuresPerFrame = vector.length / targetFrameCount;
  const deltaSizePerHand = 63;
  const positionFeaturesPerHand = modelVersion === 1 ? 63 : featuresPerHand;
  const handCount = featuresPerFrame / (positionFeaturesPerHand + deltaSizePerHand);
  if (!Number.isInteger(featuresPerFrame) || !Number.isInteger(handCount)) return 0;
  const deltaFeatureOffset = positionFeaturesPerHand * handCount;
  let total = 0; let count = 0;
  for (let frameIndex = 1; frameIndex < targetFrameCount; frameIndex += 1) for (let featureIndex = deltaFeatureOffset; featureIndex < featuresPerFrame; featureIndex += 1) { total += Math.abs(vector[frameIndex * featuresPerFrame + featureIndex] ?? 0); count += 1; }
  return count > 0 ? total / count : 0;
}
