import { describe, expect, it } from "vitest";
import { defaultContributorMetadata } from "./contributor-metadata";
import { buildContributorSamplePayload } from "./contributor-sample";

const staticSample = { sign_id: "alphabet_A", session_id: "s", landmarks_json: [], hand_count: 1, handedness: ["Right"], detector_confidence: 0.9, camera_type: "browser_webcam", lighting_note: "not_recorded", quality_status: "clean", review_status: "approved", consent_raw_image: true, raw_image_url: "image.jpg" };
const dynamicSample = { sign_id: "alphabet_J", session_id: "d", frames_json: [], frame_count: 4, fps: 15, hand_count: 1, handedness: ["Right"], detector_confidence: 0.8, camera_type: "browser_webcam", lighting_note: "not_recorded", quality_status: "clean", review_status: "approved", signer_id: null, consent_raw_image: true, raw_image_url: "video.mp4" };

describe("contributor sample payload", () => {
  it("requires consent", () => {
    expect(() => buildContributorSamplePayload({ sample: staticSample, consent: false })).toThrow("Consent is required");
  });

  it("uses privacy-safe defaults and pending review for static samples", () => {
    const result = buildContributorSamplePayload({ sample: staticSample, consent: true });
    expect(result.contributor).toEqual(defaultContributorMetadata);
    expect(result.sample).toMatchObject({ sign_id: "alphabet_A", review_status: "pending", consent_raw_image: false, raw_image_url: null });
    expect(result.modality).toBe("static");
  });

  it("preserves dynamic sample compatibility without raw media", () => {
    const result = buildContributorSamplePayload({ sample: dynamicSample, consent: true });
    expect(result.sample).toMatchObject({ sign_id: "alphabet_J", frame_count: 4, review_status: "pending", consent_raw_image: false, raw_image_url: null });
    expect(result.modality).toBe("dynamic");
  });
});

