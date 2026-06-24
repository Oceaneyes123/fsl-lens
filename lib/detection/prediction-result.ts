import type { Prediction, PredictionState } from "../prediction";

export type RecognitionResult = {
  state: PredictionState | "no_model";
  predictedLabel: string | null;
  confidence: number;
  topPredictions: Prediction[];
  stable: boolean;
  stableFrameCount: number;
  message: string;
};

export function createNoModelResult(message = "No active recognition model is loaded yet."): RecognitionResult {
  return { state: "no_model", predictedLabel: null, confidence: 0, topPredictions: [], stable: false, stableFrameCount: 0, message };
}

export function createIdleRecognitionResult(message = "Place your hand inside the camera frame."): RecognitionResult {
  return { state: "unknown", predictedLabel: null, confidence: 0, topPredictions: [], stable: false, stableFrameCount: 0, message };
}
