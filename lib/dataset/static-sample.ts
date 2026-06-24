import type { LandmarkSnapshot } from "@/lib/detection/landmark-snapshot";
import type { Sign } from "@/lib/signs";

export type StaticSample = { sign_id: string; session_id: string; landmarks_json: unknown; hand_count: number; handedness: string[]; detector_confidence: number; camera_type: string; lighting_note: string; quality_status: string; review_status: string; consent_raw_image: boolean; raw_image_url: string | null };

export function buildStaticSamplePayload({ sign, snapshot, qualityStatus, sessionId }: {
  sign: Sign;
  snapshot: LandmarkSnapshot;
  qualityStatus: string;
  sessionId: string;
}): StaticSample {
  return {
    sign_id: sign.id,
    session_id: sessionId,
    landmarks_json: snapshot.landmarks,
    hand_count: snapshot.handCount,
    handedness: snapshot.handedness,
    detector_confidence: snapshot.confidence,
    camera_type: "browser_webcam",
    lighting_note: "not_recorded",
    quality_status: qualityStatus,
    review_status: "pending",
    consent_raw_image: false,
    raw_image_url: null,
  };
}
