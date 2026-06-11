import { describe, expect, it } from "vitest";
import { buildFeedbackInsert } from "./feedback";

describe("buildFeedbackInsert", () => {
  it("builds the Supabase feedback payload from a recognition result", () => {
    expect(
      buildFeedbackInsert({
        sessionId: "session-1",
        predictedLabel: "alphabet_A",
        expectedLabel: "alphabet_B",
        confidence: 0.87,
        topPredictions: [
          { label: "alphabet_A", confidence: 0.87 },
          { label: "alphabet_B", confidence: 0.7 },
        ],
        wasCorrect: false,
      }),
    ).toEqual({
      session_id: "session-1",
      predicted_sign_id: "alphabet_A",
      expected_sign_id: "alphabet_B",
      confidence: 0.87,
      top_predictions_json: [
        { label: "alphabet_A", confidence: 0.87 },
        { label: "alphabet_B", confidence: 0.7 },
      ],
      was_correct: false,
      sample_id: null,
    });
  });
});
