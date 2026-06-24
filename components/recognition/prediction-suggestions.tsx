import type { Prediction } from "@/lib/prediction";

export function PredictionSuggestions({ predictions }: { predictions: Prediction[] }) {
  if (predictions.length < 2) return null;
  return <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Top candidates</p>{predictions.slice(0, 3).map((prediction) => <div key={prediction.label} className="flex items-center justify-between text-xs"><span>{prediction.label.replace("_", " ")}</span><span>{Math.round(prediction.confidence * 100)}%</span></div>)}</div>;
}
