export type DetectionMode = "static" | "dynamic";

export const detectionSettings = {
  defaultMode: "static" as DetectionMode,
  sequenceLength: 30,
  staticStableCount: 5,
  dynamicStableCount: 2,
  confidenceThreshold: 0.8,
  smoothingWindow: 5,
  landmarkType: "hands" as const,
  handLandmarkCount: 21,
  maxHands: 2,
  minHandConfidence: 0.6,
  mediaPipeWasmPath: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm",
  handLandmarkerPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
  staticModelPath: "/models/active-knn-model.json",
  dynamicModelPath: "/models/active-dynamic-model.json",
};
