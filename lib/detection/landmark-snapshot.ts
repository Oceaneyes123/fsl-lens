import type { NormalizedLandmark } from "@/lib/landmarks";

export type LandmarkSnapshot = {
  landmarks: NormalizedLandmark[][];
  handCount: number;
  handedness: string[];
  confidence: number;
};
