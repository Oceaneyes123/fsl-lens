import type { HandLandmarker } from "@mediapipe/tasks-vision";
import { detectionSettings } from "./detection-config";
import type { NormalizedLandmark } from "./landmarks";

export type LandmarkSnapshot = {
  landmarks: NormalizedLandmark[][];
  handCount: number;
  handedness: string[];
  confidence: number;
};

const zeroLandmark = (): NormalizedLandmark => ({ x: 0, y: 0, z: 0 });

export function normalizeDetectedHands(hands: readonly (readonly NormalizedLandmark[])[]) {
  return hands.map((hand) =>
    Array.from({ length: detectionSettings.handLandmarkCount }, (_, index) => {
      const point = hand[index];
      return point && Number.isFinite(point.x) && Number.isFinite(point.y)
        ? { x: point.x, y: point.y, z: Number.isFinite(point.z) ? point.z : 0 }
        : zeroLandmark();
    }),
  );
}

export class LandmarkExtractor {
  private landmarker: HandLandmarker | null = null;

  async load() {
    if (this.landmarker) return;

    const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
    const vision = await FilesetResolver.forVisionTasks(detectionSettings.mediaPipeWasmPath);
    this.landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: detectionSettings.handLandmarkerPath,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: detectionSettings.maxHands,
      minHandDetectionConfidence: detectionSettings.minHandConfidence,
      minHandPresenceConfidence: detectionSettings.minHandConfidence,
      minTrackingConfidence: detectionSettings.minHandConfidence,
    });
  }

  detect(video: HTMLVideoElement, timestamp: number): LandmarkSnapshot | null {
    if (!this.landmarker) throw new Error("Landmark extractor is not loaded.");

    const result = this.landmarker.detectForVideo(video, timestamp);
    if (result.landmarks.length === 0) return null;

    const landmarks = normalizeDetectedHands(result.landmarks);
    const handedness = result.handednesses.map((group) => group[0]?.categoryName ?? "unknown");
    const confidence = result.handednesses.reduce((sum, group) => sum + (group[0]?.score ?? 0), 0) /
      Math.max(1, result.handednesses.length);

    return { landmarks, handCount: landmarks.length, handedness, confidence };
  }

  close() {
    this.landmarker?.close();
    this.landmarker = null;
  }
}
