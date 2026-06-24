import { describe, expect, it } from "vitest";
import { buildDynamicSamplePayload } from "./dynamic-sample";
import { buildStaticSamplePayload } from "./static-sample";
import type { Sign } from "../signs";

const sign: Sign = {
  id: "alphabet_A",
  label: "alphabet_A",
  displayName: "A",
  type: "alphabet",
  modality: "static",
  expectedHandCount: 1,
  referenceImageUrl: "/references/alphabet-a.png",
  shortInstruction: "Hold A.",
  commonMistakes: "None.",
};
const landmarks = [[{ x: 0.4, y: 0.5, z: 0 }]];
const snapshot = { landmarks, handCount: 1, handedness: ["Right"], confidence: 0.9 };

describe("sample payload builders", () => {
  it("builds the existing static sample shape with the supplied session and quality", () => {
    expect(buildStaticSamplePayload({ sign, snapshot, qualityStatus: "clean", sessionId: "static-session" })).toEqual({
      sign_id: "alphabet_A",
      session_id: "static-session",
      landmarks_json: landmarks,
      hand_count: 1,
      handedness: ["Right"],
      detector_confidence: 0.9,
      camera_type: "browser_webcam",
      lighting_note: "not_recorded",
      quality_status: "clean",
      review_status: "pending",
      consent_raw_image: false,
      raw_image_url: null,
    });
  });

  it("builds the existing dynamic sample shape from the recording summary", () => {
    const frames = [landmarks, [[{ x: 0.6, y: 0.5, z: 0 }]]];
    expect(buildDynamicSamplePayload({
      sign: { ...sign, id: "alphabet_J", label: "alphabet_J", modality: "dynamic" },
      snapshot,
      recording: { frames, frameCount: 2, averageConfidence: 0.85 },
      qualityStatus: "low_quality",
      sessionId: "dynamic-session",
    })).toEqual({
      sign_id: "alphabet_J",
      session_id: "dynamic-session",
      frames_json: frames,
      frame_count: 2,
      fps: 15,
      hand_count: 1,
      handedness: ["Right"],
      detector_confidence: 0.85,
      camera_type: "browser_webcam",
      lighting_note: "not_recorded",
      quality_status: "low_quality",
      review_status: "pending",
      signer_id: null,
      consent_raw_image: false,
      raw_image_url: null,
    });
  });
});
