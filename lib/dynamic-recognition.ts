import { normalizeDynamicSequence, type LandmarkFrame } from "./dynamic-landmarks";
import { distanceToConfidence, euclideanDistance, evaluatePrediction, type PredictionState, type Prediction } from "./prediction";

export type DynamicModelSample = {
  signLabel: string;
  handCount: number;
  vector: number[];
  qualityStatus?: string;
};

export type DynamicSequenceModel = {
  versionName: string;
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
  const sequenceMotion = calculateSequenceMotion(vector, model.sequenceConfig.targetFrameCount);
  const candidates = model.samples.filter(
    (sample) =>
      sample.handCount === handCount &&
      sample.vector.length === vector.length &&
      hasComparableMotion(sequenceMotion, sample.vector, model.sequenceConfig.targetFrameCount),
  );
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

  return {
    state: evaluation.state,
    predictedLabel: evaluation.state === "unknown" ? null : (evaluation.topPredictions[0]?.label ?? null),
    confidence: evaluation.topPredictions[0]?.confidence ?? 0,
    topPredictions: evaluation.topPredictions,
    message: evaluation.message,
  };
}

function hasComparableMotion(sequenceMotion: number, sampleVector: number[], targetFrameCount: number) {
  const sampleMotion = calculateSequenceMotion(sampleVector, targetFrameCount);

  if (sampleMotion <= 0) {
    return false;
  }

  return sequenceMotion >= Math.max(0.002, sampleMotion * 0.65) && sequenceMotion <= sampleMotion * 1.6;
}

function calculateSequenceMotion(vector: number[], targetFrameCount: number) {
  if (targetFrameCount <= 0 || vector.length === 0) {
    return 0;
  }

  const featuresPerFrame = vector.length / targetFrameCount;
  const deltaFeatureOffset = featuresPerFrame / 2;

  if (!Number.isInteger(featuresPerFrame) || !Number.isInteger(deltaFeatureOffset)) {
    return 0;
  }

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
