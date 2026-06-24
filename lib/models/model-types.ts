import type { ModelType } from "../detection/classifier-types";

export type ModelSample = { signLabel: string; handCount: number; handedness: string[]; vector: number[]; qualityStatus?: string };
export type KnnModel = {
  versionName: string;
  featureVersion?: number;
  thresholdConfig: { confirmThreshold: number; uncertainThreshold: number; requiredStableFrames: number };
  samples: ModelSample[];
};
export type DynamicModelSample = { signLabel: string; handCount: number; vector: number[]; qualityStatus?: string };
export type DynamicSequenceModel = {
  versionName: string;
  featureVersion?: number;
  thresholdConfig: { confirmThreshold: number; uncertainThreshold: number; requiredStableSequences: number };
  sequenceConfig: { targetFrameCount: number };
  samples: DynamicModelSample[];
};
export type RecognitionModel = KnnModel | DynamicSequenceModel;
export type RecognitionModelType = ModelType;
