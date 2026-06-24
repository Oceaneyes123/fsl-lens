import { Check, X } from "lucide-react";

export function PracticeVerdictPanel({ displayName, hasVerdict, isCorrect }: {
  displayName: string;
  hasVerdict: boolean;
  isCorrect: boolean;
}) {
  return <section className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-line bg-white p-6 text-center shadow-soft">
    <p className="text-7xl font-bold leading-none text-ink sm:text-8xl">{displayName}</p>
    <div className="mt-6 flex h-36 w-36 items-center justify-center">
      {hasVerdict ? isCorrect ? <Check className="h-32 w-32 text-teal" strokeWidth={3} aria-label="Correct" /> : <X className="h-32 w-32 text-coral" strokeWidth={3} aria-label="Incorrect" /> : <div className="h-24 w-24 rounded-full border-4 border-dashed border-slate-300" aria-label="Waiting" />}
    </div>
  </section>;
}
