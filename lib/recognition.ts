import { evaluatePrediction, type Prediction, type PredictionState } from "./prediction";
import { normalizeLandmarks, featuresPerHand, featureVersion, type NormalizedLandmark } from "./landmarks";

const kNeighbors = 3;

export type ModelSample = {
  signLabel: string;
  handCount: number;
  handedness: string[];
  vector: number[];
  qualityStatus?: string;
};

export type KnnModel = {
  versionName: string;
  /** Feature version for backward compatibility checking. Absent = v1 (63 features). */
  featureVersion?: number;
  thresholdConfig: {
    confirmThreshold: number;
    uncertainThreshold: number;
    requiredStableFrames: number;
  };
  samples: ModelSample[];
};

export type RecognitionResult = {
  state: PredictionState | "no_model";
  predictedLabel: string | null;
  confidence: number;
  topPredictions: Prediction[];
  stable: boolean;
  stableFrameCount: number;
  message: string;
};

export function recognizeLandmarks({
  model,
  landmarks,
  handCount,
}: {
  model: KnnModel;
  landmarks: NormalizedLandmark[][];
  handCount: number;
  handedness: string[];
}): RecognitionResult {
  return recognizeStaticVector(model, normalizeLandmarks(landmarks), handCount);
}

function recognizeStaticVector(model: KnnModel, vector: number[], handCount: number): RecognitionResult {
  const modelVersion = model.featureVersion ?? 1;
  if (modelVersion !== 1 && modelVersion !== featureVersion) {
    return createNoModelResult(
      `Model version v${modelVersion} incompatible with runtime v${featureVersion}. Please retrain the model with: npm run train:model`,
    );
  }

  const modelVector = modelVersion === 1 ? toLegacyStaticVector(vector, handCount) : vector;

  const candidates = model.samples.filter(
    (sample) => sample.handCount === handCount && sample.vector.length === modelVector.length,
  );

  if (candidates.length === 0) {
    return createIdleRecognitionResult("No matching samples in the current model for this hand configuration.");
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
  const predictedLabel = evaluation.state === "unknown" ? null : (evaluation.topPredictions[0]?.label ?? null);

  return {
    state: evaluation.state,
    predictedLabel,
    confidence: evaluation.topPredictions[0]?.confidence ?? 0,
    topPredictions: evaluation.topPredictions,
    stable: false,
    stableFrameCount: 0,
    message: evaluation.message,
  };
}

function toLegacyStaticVector(vector: number[], handCount: number) {
  if (vector.length !== handCount * featuresPerHand) return vector;
  return Array.from({ length: handCount }, (_, index) =>
    vector.slice(index * featuresPerHand, index * featuresPerHand + 63),
  ).flat();
}

export class StaticKNNClassifier {
  private model: KnnModel | null = null;

  loadModel(model: KnnModel) {
    this.model = model;
  }

  predict(vector: number[], handCount: number) {
    return this.model
      ? recognizeStaticVector(this.model, vector, handCount)
      : createNoModelResult();
  }
}

/**
 * Weighted k-NN voting.
 * Takes the k nearest neighbors (or fewer if not enough samples),
 * weights each by inverse squared distance, then sums weights per label.
 * Returns deduplicated predictions sorted by aggregated confidence descending.
 * Labels are ordered by weighted vote; confidence is the winning label's nearest-sample quality.
 */
export function kWeightedVote(
  distances: { label: string; distance: number }[],
  k: number,
): Prediction[] {
  const sorted = [...distances].sort((a, b) => a.distance - b.distance);
  const neighbors = sorted.slice(0, Math.min(k, sorted.length));

  if (neighbors.length === 0) {
    return [];
  }

  // Sum weights per label
  const weightByLabel = new Map<string, number>();
  const bestDistanceByLabel = new Map<string, number>();

  for (const { label, distance } of neighbors) {
    // Inverse squared distance weight: closer samples get higher weight
    const weight = 1 / (1 + distance * distance);
    weightByLabel.set(label, (weightByLabel.get(label) ?? 0) + weight);
    bestDistanceByLabel.set(label, Math.min(bestDistanceByLabel.get(label) ?? Number.POSITIVE_INFINITY, distance));
  }

  // Convert to confidence and sort
  return Array.from(weightByLabel)
    .sort((left, right) => right[1] - left[1])
    .map(([label]) => ({ label, confidence: distanceToConfidence(bestDistanceByLabel.get(label) ?? Number.POSITIVE_INFINITY) }));
}

export function createNoModelResult(message = "No active recognition model is loaded yet."): RecognitionResult {
  return {
    state: "no_model",
    predictedLabel: null,
    confidence: 0,
    topPredictions: [],
    stable: false,
    stableFrameCount: 0,
    message,
  };
}

export function createIdleRecognitionResult(message = "Place your hand inside the camera frame."): RecognitionResult {
  return {
    state: "unknown",
    predictedLabel: null,
    confidence: 0,
    topPredictions: [],
    stable: false,
    stableFrameCount: 0,
    message,
  };
}

function euclideanDistance(left: number[], right: number[]) {
  let sum = 0;

  for (let index = 0; index < left.length; index += 1) {
    const delta = left[index] - right[index];
    sum += delta * delta;
  }

  return Math.sqrt(sum / left.length);
}

export function distanceToConfidence(distance: number) {
  return Math.max(0, Math.min(1, 1 / (1 + distance)));
}
