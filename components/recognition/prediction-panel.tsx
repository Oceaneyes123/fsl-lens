import type { RecognitionResult } from "@/lib/recognition";

export function PredictionPanel({ predictedSign, recognition, requiredStableFrames }: {
  predictedSign: { value: string; type: string };
  recognition: RecognitionResult;
  requiredStableFrames: number;
}) {
  return <>
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{predictedSign.type}</p>
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${recognition.state === "confirmed" ? "bg-emerald-50 text-emerald-700" : recognition.state === "uncertain" ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-500"}`}>
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${recognition.state === "confirmed" ? "bg-emerald-500" : recognition.state === "uncertain" ? "bg-amber-500" : "bg-slate-400"}`} />
        {recognition.state === "confirmed" ? "Confirmed" : recognition.state === "uncertain" ? "Uncertain" : "Waiting"}
      </span>
    </div>
    <div className="mt-4 flex flex-1 flex-col items-center justify-center">
      <p data-testid="predicted-sign-value" className={`font-bold leading-none ${predictedSign.value === "Unknown" ? "text-5xl sm:text-6xl text-slate-400" : "text-7xl sm:text-8xl text-ink"}`}>{predictedSign.value}</p>
      {recognition.topPredictions.length > 0 && <div className="mt-4 w-full max-w-[200px]">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full transition-all duration-200 ${recognition.state === "confirmed" ? "bg-emerald-500" : recognition.state === "uncertain" ? "bg-amber-500" : "bg-slate-300"}`} style={{ width: `${Math.round(recognition.confidence * 100)}%` }} />
        </div>
        <p className="mt-1 text-center text-xs text-slate-500">{Math.round(recognition.confidence * 100)}% confidence</p>
      </div>}
      {recognition.stableFrameCount > 0 && recognition.state !== "confirmed" && <p className="mt-2 text-xs text-slate-400">Hold stable ({recognition.stableFrameCount}/{requiredStableFrames})</p>}
    </div>
  </>;
}
