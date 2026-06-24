import { Check, X } from "lucide-react";

export function CaptureFeedbackPanel({ message, onFeedback }: { message: string; onFeedback: (wasCorrect: boolean) => void }) {
  return <>
    <div className="mt-5 grid grid-cols-2 gap-2">
      <button type="button" onClick={() => onFeedback(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line text-sm font-semibold text-teal"><Check className="h-4 w-4" aria-hidden="true" />Correct</button>
      <button type="button" onClick={() => onFeedback(false)} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line text-sm font-semibold text-coral"><X className="h-4 w-4" aria-hidden="true" />Wrong</button>
    </div>
    {message ? <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p> : null}
  </>;
}
