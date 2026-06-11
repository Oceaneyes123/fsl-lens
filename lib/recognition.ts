import { evaluatePrediction, type Prediction, type PredictionState } from "./prediction";
import { normalizeLandmarks, type NormalizedLandmark } from "./landmarks";

export type ModelSample = {
  signLabel: string;
  handCount: number;
  handedness: string[];
  vector: number[];
  qualityStatus?: string;
};

export type KnnModel = {
  versionName: string;
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
  const vector = normalizeLandmarks(landmarks);
  const candidates = model.samples.filter((sample) => sample.handCount === handCount && sample.vector.length === vector.length);
  const predictions = candidates
    .map((sample) => ({
      label: sample.signLabel,
      confidence: distanceToConfidence(euclideanDistance(vector, sample.vector)),
    }))
    .sort((a, b) => b.confidence - a.confidence);
  const evaluation = evaluatePrediction({
    predictions,
    confirmThreshold: model.thresholdConfig.confirmThreshold,
    uncertainThreshold: model.thresholdConfig.uncertainThreshold,
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

function distanceToConfidence(distance: number) {
  return Math.max(0, Math.min(1, 1 / (1 + distance)));
}
