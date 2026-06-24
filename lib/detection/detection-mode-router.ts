import { DynamicSequenceKNNClassifier } from "../classifiers/dynamic-sequence-knn-classifier";
import { StaticKNNClassifier, recognizeLandmarks } from "../classifiers/static-knn-classifier";
import { recognizeDynamicSequence } from "../dynamic-recognition";
import { normalizeDynamicSequenceFrames, type LandmarkFrame } from "../dynamic-landmarks";
import { SequenceBuffer } from "../dynamic-capture";
import { normalizeLandmarks, type NormalizedLandmark } from "../landmarks";
import type { DynamicSequenceModel, KnnModel } from "../models/model-types";
import { PredictionSmoother } from "../prediction";
import { createIdleRecognitionResult, createNoModelResult, type RecognitionResult } from "./prediction-result";
import { detectionSettings, type DetectionMode } from "./detection-config";

type RouterSnapshot = { landmarks: NormalizedLandmark[][]; handCount: number };

export class DetectionModeRouter {
  private mode: DetectionMode = detectionSettings.defaultMode;
  private readonly staticClassifier = new StaticKNNClassifier();
  private readonly dynamicClassifier = new DynamicSequenceKNNClassifier();
  private sequenceBuffer: SequenceBuffer;
  private sequenceLength: number;
  private rawFrames: LandmarkFrame[] = [];
  private staticSmoother: PredictionSmoother;
  private dynamicSmoother: PredictionSmoother;

  constructor(private readonly config: { sequenceLength?: number } = {}) {
    this.sequenceLength = config.sequenceLength ?? detectionSettings.sequenceLength;
    this.sequenceBuffer = new SequenceBuffer(this.sequenceLength);
    this.staticSmoother = this.createSmoother(detectionSettings.staticStableCount);
    this.dynamicSmoother = this.createSmoother(detectionSettings.dynamicStableCount);
  }
  loadStaticModel(model: KnnModel) { this.staticClassifier.loadModel(model); this.staticSmoother = this.createSmoother(model.thresholdConfig.requiredStableFrames); }
  loadDynamicModel(model: DynamicSequenceModel) {
    this.dynamicClassifier.loadModel(model);
    this.dynamicSmoother = this.createSmoother(model.thresholdConfig.requiredStableSequences);
    if (this.config.sequenceLength === undefined && model.sequenceConfig.targetFrameCount !== this.sequenceLength) {
      this.sequenceLength = model.sequenceConfig.targetFrameCount;
      this.sequenceBuffer = new SequenceBuffer(this.sequenceLength);
      this.resetSequence();
    }
  }
  setMode(mode: DetectionMode) { if (mode !== this.mode) { this.mode = mode; this.reset(); } }
  predict(snapshot: RouterSnapshot | null): RecognitionResult {
    if (!snapshot) { this.reset(); return createIdleRecognitionResult(); }
    if (this.mode === "static") return this.smooth(this.staticClassifier.predict(normalizeLandmarks(snapshot.landmarks), snapshot.handCount), this.staticSmoother);
    this.rawFrames = [...this.rawFrames, snapshot.landmarks].slice(-this.sequenceLength);
    this.sequenceBuffer.reset();
    normalizeDynamicSequenceFrames(this.rawFrames).forEach((features) => this.sequenceBuffer.addFrame(features));
    if (!this.sequenceBuffer.isReady()) return createIdleRecognitionResult(`Collecting motion (${this.rawFrames.length}/${this.sequenceLength} frames).`);
    const result = this.dynamicClassifier.predict(this.sequenceBuffer.getSequence(), snapshot.handCount);
    return this.smooth({ ...result, stable: false, stableFrameCount: 0 }, this.dynamicSmoother);
  }
  reset() { this.resetSequence(); this.staticSmoother.reset(); this.dynamicSmoother.reset(); }
  private resetSequence() { this.rawFrames = []; this.sequenceBuffer.reset(); }
  private createSmoother(stableCount: number) { return new PredictionSmoother({ confidenceThreshold: detectionSettings.confidenceThreshold, stableCount, historySize: Math.max(detectionSettings.smoothingWindow, stableCount) }); }
  private smooth(result: RecognitionResult, smoother: PredictionSmoother): RecognitionResult {
    const prediction = result.state === "confirmed" && result.predictedLabel ? { label: result.predictedLabel, confidence: result.confidence } : null;
    const smoothed = smoother.update(prediction);
    const confirmed = result.state === "confirmed" && smoothed.stable;
    return { ...result, state: confirmed ? "confirmed" : result.state === "confirmed" ? "uncertain" : result.state, stable: smoothed.stable, stableFrameCount: smoothed.count, message: confirmed ? result.message : result.state === "confirmed" ? `Hold or repeat for confirmation (${smoothed.count}).` : result.message };
  }
}

export function recognizeVisibleSign({ model, dynamicModel, landmarks, dynamicFrames, handCount, handedness }: { model: KnnModel | null; dynamicModel: DynamicSequenceModel | null; landmarks: NormalizedLandmark[][]; dynamicFrames: LandmarkFrame[]; handCount: number; handedness: string[] }): RecognitionResult {
  const staticResult = model ? recognizeLandmarks({ model, landmarks, handCount, handedness }) : null;
  const dynamicResult = dynamicModel && dynamicFrames.length >= 2 ? { ...recognizeDynamicSequence({ model: dynamicModel, frames: dynamicFrames, handCount }), stable: false, stableFrameCount: 0 } : null;
  if (dynamicResult?.state === "confirmed" && (!staticResult || staticResult.state !== "confirmed" || dynamicResult.confidence >= staticResult.confidence)) return dynamicResult;
  return staticResult ?? dynamicResult ?? createNoModelResult("No active recognition model is loaded yet.");
}
