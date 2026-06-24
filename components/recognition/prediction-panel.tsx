import type { RecognitionResult } from "@/lib/detection/prediction-result";
import { PredictionSuggestions } from "./prediction-suggestions";

export function PredictionPanel({ result }: { result: RecognitionResult }) {
  return <section className="rounded-lg border border-line bg-white p-6 shadow-soft"><p className="text-2xl font-semibold text-ink">{result.predictedLabel?.replace("_", " ") ?? "Unknown"}</p><p className="mt-2 text-sm text-slate-600">{result.message}</p><PredictionSuggestions predictions={result.topPredictions} /></section>;
}
