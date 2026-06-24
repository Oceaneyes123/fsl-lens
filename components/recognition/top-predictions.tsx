import type { Prediction } from "@/lib/prediction";

export function TopPredictions({ predictions }: { predictions: Prediction[] }) {
  if (predictions.length <= 1) return null;
  return <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Top candidates</p>
    {predictions.slice(0, 3).map((prediction, index) => <div key={prediction.label} className="flex items-center gap-2">
      <span className="w-6 text-right text-[11px] font-medium text-slate-600">{index === 0 ? "1st" : index === 1 ? "2nd" : "3rd"}</span>
      <div className="flex flex-1 items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal/60 transition-all duration-200" style={{ width: `${Math.round(prediction.confidence * 100)}%` }} /></div>
        <span className="w-8 text-right text-[11px] font-medium text-slate-500">{Math.round(prediction.confidence * 100)}%</span>
      </div>
    </div>)}
  </div>;
}
