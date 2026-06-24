import { normalizeDynamicSequence, type LandmarkFrame } from "./dynamic-landmarks";
import { evaluatePrediction, type PredictionState, type Prediction } from "./prediction";
import { kWeightedVote } from "./recognition";
import { featuresPerHand, featureVersion } from "./landmarks";
import { createNoModelResult, type RecognitionResult } from "./recognition";

const kNeighbors = 3;

export type DynamicModelSample = {
  signLabel: string;
  handCount: number;
  vector: number[];
  qualityStatus?: string;
};

export type DynamicSequenceModel = {
  versionName: string;
  featureVersion?: number;
  thresholdConfig: {
    confirmThreshold: number;
    uncertainThreshold: number;
    requiredStableSequences: number;
  };
  sequenceConfig: {
    targetFrameCount: number;
  };
  samples: DynamicModelSample[];
};

export type DynamicRecognitionResult = {
  state: PredictionState | "no_model";
  predictedLabel: string | null;
  confidence: number;
  topPredictions: Prediction[];
  message: string;
};

export function recognizeDynamicSequence({
  model,
  frames,
  handCount,
}: {
  model: DynamicSequenceModel;
  frames: LandmarkFrame[];
  handCount: number;
}): DynamicRecognitionResult {
  const vector = normalizeDynamicSequence(frames, { targetFrameCount: model.sequenceConfig.targetFrameCount });
  return recognizeDynamicVector(model, vector, handCount);
}

function recognizeDynamicVector(model: DynamicSequenceModel, vector: number[], handCount: number): DynamicRecognitionResult {
  const modelVersion = model.featureVersion ?? 1;
  if (modelVersion !== 1 && modelVersion !== featureVersion) {
    return {
      state: "no_model",
      predictedLabel: null,
      confidence: 0,
      topPredictions: [],
      message: `Dynamic model version v${modelVersion} incompatible with runtime v${featureVersion}. Please retrain the model with: npm run train:dynamic-model`,
    };
  }

  const modelVector = modelVersion === 1
    ? toLegacyDynamicVector(vector, model.sequenceConfig.targetFrameCount, handCount)
    : vector;
  const sequenceMotion = calculateSequenceMotion(modelVector, model.sequenceConfig.targetFrameCount, modelVersion);

  // Pre-filter by hand count, vector length, and comparable motion
  const candidates = model.samples.filter(
    (sample) =>
      sample.handCount === handCount &&
      sample.vector.length === modelVector.length &&
      hasComparableMotion(sequenceMotion, sample.vector, model.sequenceConfig.targetFrameCount, modelVersion),
  );

  if (candidates.length === 0) {
    return {
      state: "unknown",
      predictedLabel: null,
      confidence: 0,
      topPredictions: [],
      message: "No matching dynamic samples for this motion profile.",
    };
  }

  // Weighted k-NN: compute distances, take top-k, aggregate by label
  const distances = candidates.map((sample) => ({
    label: sample.signLabel,
    distance: euclideanDistance(modelVector, sample.vector),
  }));

  const predictions = kWeightedVote(distances, kNeighbors);

  const evaluation = evaluatePrediction({
    predictions,
    confirmThreshold: model.thresholdConfig.confirmThreshold,
    uncertainThreshold: model.thresholdConfig.uncertainThreshold,
    preserveOrder: true,
  });

  return {
    state: evaluation.state,
    predictedLabel: evaluation.state === "unknown" ? null : (evaluation.topPredictions[0]?.label ?? null),
    confidence: evaluation.topPredictions[0]?.confidence ?? 0,
    topPredictions: evaluation.topPredictions,
    message: evaluation.message,
  };
}

function toLegacyDynamicVector(vector: number[], targetFrameCount: number, handCount: number) {
  const frameSize = handCount * (featuresPerHand + 63);
  if (vector.length !== targetFrameCount * frameSize) return vector;

  return Array.from({ length: targetFrameCount }, (_, frameIndex) => {
    const frame = vector.slice(frameIndex * frameSize, (frameIndex + 1) * frameSize);
    const positions = Array.from({ length: handCount }, (_, handIndex) =>
      frame.slice(handIndex * featuresPerHand, handIndex * featuresPerHand + 63),
    ).flat();
    return [...positions, ...frame.slice(handCount * featuresPerHand)];
  }).flat();
}

export class DynamicSequenceClassifier {
  private model: DynamicSequenceModel | null = null;

  loadModel(model: DynamicSequenceModel) {
    this.model = model;
  }

  predict(sequence: number[][], handCount: number): RecognitionResult {
    if (!this.model) return createNoModelResult("No active dynamic recognition model is loaded yet.");
    const result = recognizeDynamicVector(this.model, sequence.flat(), handCount);
    return { ...result, stable: false, stableFrameCount: 0 };
  }
}

function euclideanDistance(left: number[], right: number[]) {
  let sum = 0;

  for (let index = 0; index < left.length; index += 1) {
    const delta = left[index] - right[index];
    sum += delta * delta;
  }

  return Math.sqrt(sum / left.length);
}

function hasComparableMotion(sequenceMotion: number, sampleVector: number[], targetFrameCount: number, modelVersion: number) {
  const sampleMotion = calculateSequenceMotion(sampleVector, targetFrameCount, modelVersion);

  if (sampleMotion <= 0) {
    return false;
  }

  return sequenceMotion >= Math.max(0.002, sampleMotion * 0.65) && sequenceMotion <= sampleMotion * 1.6;
}

function calculateSequenceMotion(vector: number[], targetFrameCount: number, modelVersion: number) {
  if (targetFrameCount <= 0 || vector.length === 0) {
    return 0;
  }

  const featuresPerFrame = vector.length / targetFrameCount;
  // Frame layout per hand: [normalized_positions(63) + finger_features(9) | raw_deltas(63)]
  // Deltas start at featuresPerHand * handCount from the frame start
  const deltaSizePerHand = 21 * 3; // raw coordinate deltas
  const positionFeaturesPerHand = modelVersion === 1 ? 63 : featuresPerHand;
  const handCount = featuresPerFrame / (positionFeaturesPerHand + deltaSizePerHand);

  if (!Number.isInteger(featuresPerFrame) || !Number.isInteger(handCount)) {
    return 0;
  }

  const deltaFeatureOffset = positionFeaturesPerHand * handCount;

  let total = 0;
  let count = 0;

  for (let frameIndex = 1; frameIndex < targetFrameCount; frameIndex += 1) {
    const frameStart = frameIndex * featuresPerFrame;

    for (let featureIndex = deltaFeatureOffset; featureIndex < featuresPerFrame; featureIndex += 1) {
      total += Math.abs(vector[frameStart + featureIndex] ?? 0);
      count += 1;
    }
  }

  return count > 0 ? total / count : 0;
}
