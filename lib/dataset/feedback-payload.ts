import type { RecognitionResult } from "@/lib/detection/prediction-result";

export function buildFeedbackPayload({
  sessionId,
  recognition,
  isPractice,
  selectedSignLabel,
  wasCorrect,
  lastSampleId,
}: {
  sessionId: string;
  recognition: RecognitionResult;
  isPractice: boolean;
  selectedSignLabel: string;
  wasCorrect: boolean;
  lastSampleId: string | null;
}) {
  return {
    session_id: sessionId,
    predicted_sign_id: recognition.predictedLabel,
    expected_sign_id: isPractice ? selectedSignLabel : null,
    confidence: recognition.confidence,
    top_predictions_json: recognition.topPredictions,
    was_correct: wasCorrect,
    sample_id: lastSampleId,
  };
}
