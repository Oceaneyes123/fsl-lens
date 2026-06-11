import type { Prediction } from "./prediction";

export type FeedbackInsert = {
  session_id: string;
  predicted_sign_id: string | null;
  expected_sign_id: string | null;
  confidence: number | null;
  top_predictions_json: Prediction[];
  was_correct: boolean;
  sample_id: string | null;
};

export function buildFeedbackInsert({
  sessionId,
  predictedLabel,
  expectedLabel = null,
  confidence,
  topPredictions,
  wasCorrect,
  sampleId = null,
}: {
  sessionId: string;
  predictedLabel: string | null;
  expectedLabel?: string | null;
  confidence: number | null;
  topPredictions: Prediction[];
  wasCorrect: boolean;
  sampleId?: string | null;
}): FeedbackInsert {
  return {
    session_id: sessionId,
    predicted_sign_id: predictedLabel,
    expected_sign_id: expectedLabel,
    confidence,
    top_predictions_json: topPredictions,
    was_correct: wasCorrect,
    sample_id: sampleId,
  };
}
