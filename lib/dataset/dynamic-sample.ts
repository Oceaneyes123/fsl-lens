import type { LandmarkSnapshot } from "@/components/camera-tracker";
import type { LandmarkFrame } from "@/lib/dynamic-landmarks";
import type { Sign } from "@/lib/signs";

export type DynamicSample = { sign_id: string; session_id: string; frames_json: unknown; frame_count: number; fps: number; hand_count: number; handedness: string[]; detector_confidence: number; camera_type: string; lighting_note: string; quality_status: string; review_status: string; signer_id: string | null; consent_raw_image: boolean; raw_image_url: string | null };

export function buildDynamicSamplePayload({ sign, snapshot, recording, qualityStatus, sessionId }: {
  sign: Sign;
  snapshot: LandmarkSnapshot;
  recording: { frames: LandmarkFrame[]; frameCount: number; averageConfidence: number };
  qualityStatus: string;
  sessionId: string;
}): DynamicSample {
  return {
    sign_id: sign.id,
    session_id: sessionId,
    frames_json: recording.frames,
    frame_count: recording.frameCount,
    fps: 15,
    hand_count: snapshot.handCount,
    handedness: snapshot.handedness,
    detector_confidence: recording.averageConfidence,
    camera_type: "browser_webcam",
    lighting_note: "not_recorded",
    quality_status: qualityStatus,
    review_status: "pending",
    signer_id: null,
    consent_raw_image: false,
    raw_image_url: null,
  };
}
