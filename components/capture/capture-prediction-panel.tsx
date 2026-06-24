import { HandMetal } from "lucide-react";
import type { RecognitionResult } from "@/lib/recognition";

export function CapturePredictionPanel({ recognition, requiredStableFrames, modelMessage, correctionTip }: {
  recognition: RecognitionResult;
  requiredStableFrames: number;
  modelMessage: string;
  correctionTip: string;
}) {
  return <>
    <h2 className="text-lg font-semibold text-ink">Prediction</h2>
    <div className="mt-4 flex items-center gap-3">
      <span className="flex h-12 w-12 items-center justify-center rounded-md bg-coral text-white"><HandMetal className="h-6 w-6" aria-hidden="true" /></span>
      <div>
        <p className="text-2xl font-semibold text-ink">{recognition.state === "no_model" ? "No model loaded" : recognition.predictedLabel?.replace("_", " ") ?? "Unknown"}</p>
        <p className="text-sm text-slate-600">{recognition.message}</p>
      </div>
    </div>
    <div className="mt-5">
      <div className="flex justify-between text-sm font-medium text-slate-700"><span>Confidence</span><span>{Math.round(recognition.confidence * 100)}%</span></div>
      <div className="mt-2 h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-teal" style={{ width: `${Math.round(recognition.confidence * 100)}%` }} /></div>
      <p className="mt-2 text-xs text-slate-500">Stability: {recognition.stableFrameCount}/{requiredStableFrames} frames</p>
    </div>
    <div className="mt-5">
      <h3 className="text-sm font-semibold text-ink">Top 3 suggestions</h3>
      <div className="mt-3 space-y-2">
        {recognition.topPredictions.length === 0
          ? <p className="text-sm text-slate-600">{recognition.state === "no_model" ? modelMessage : "No hand detected yet."}</p>
          : recognition.topPredictions.map((item) => <div key={item.label} className="flex items-center justify-between rounded-md bg-mist px-3 py-2"><span className="text-sm font-medium text-ink">{item.label.replace("_", " ")}</span><span className="text-sm text-slate-600">{Math.round(item.confidence * 100)}%</span></div>)}
      </div>
    </div>
    <div className="mt-5 rounded-md border border-coral/30 bg-coral/5 p-3">
      <p className="text-sm font-semibold text-coral">Correction tip</p>
      <p className="mt-1 text-sm leading-6 text-slate-700">{correctionTip}</p>
    </div>
  </>;
}
