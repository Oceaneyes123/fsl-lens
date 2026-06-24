export type ModelRuntime = "knn" | "onnx" | "tfjs";
export type ModelManifest = {
  modelId: string;
  versionName: string;
  modelType: "static_knn" | "dynamic_sequence_knn" | "bilstm" | "transformer";
  runtime: ModelRuntime;
  supportedSigns: string[];
  featureSchemaVersion: "hand_v1" | "holistic_v2";
  landmarkSchemaVersion: "hand_v1" | "holistic_v2";
  sequenceLength?: number;
  trainingSampleCount?: number;
  signerCount?: number;
  metrics?: { top1Accuracy?: number; top3Accuracy?: number; signerIndependentTop1?: number };
  status: "active" | "candidate" | "archived";
  artifactUrl?: string;
  labelMapUrl?: string;
  preprocessingConfigUrl?: string;
  createdAt?: string;
};

