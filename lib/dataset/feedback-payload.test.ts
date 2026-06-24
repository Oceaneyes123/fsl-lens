import { describe, expect, it } from "vitest";
import { buildFeedbackPayload } from "./feedback-payload";

const recognition = {
  state: "confirmed" as const,
  predictedLabel: "alphabet_A",
  confidence: 0.98,
  topPredictions: [{ label: "alphabet_A", confidence: 0.98 }],
  stable: true,
  stableFrameCount: 5,
  message: "Prediction confirmed.",
};

describe("buildFeedbackPayload", () => {
  it("includes the expected sign in practice mode", () => {
    expect(buildFeedbackPayload({
      sessionId: "session-123",
      recognition,
      isPractice: true,
      selectedSignLabel: "alphabet_B",
      wasCorrect: false,
      lastSampleId: "sample-456",
    })).toEqual({
      session_id: "session-123",
      predicted_sign_id: "alphabet_A",
      expected_sign_id: "alphabet_B",
      confidence: 0.98,
      top_predictions_json: recognition.topPredictions,
      was_correct: false,
      sample_id: "sample-456",
    });
  });

  it("omits the expected sign outside practice mode", () => {
    expect(buildFeedbackPayload({
      sessionId: "session-789",
      recognition,
      isPractice: false,
      selectedSignLabel: "alphabet_B",
      wasCorrect: true,
      lastSampleId: null,
    })).toMatchObject({
      session_id: "session-789",
      expected_sign_id: null,
      was_correct: true,
      sample_id: null,
    });
  });
});
