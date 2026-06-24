export function DynamicRecordingPanel({ frameCount, onStart, onStop }: { frameCount: number; onStart: () => void; onStop: () => void }) {
  return <>
    <div className="mt-3 rounded-md border border-line bg-mist p-3">
      <p className="text-sm font-semibold text-ink">Dynamic sign</p>
      <p className="mt-1 text-sm leading-6 text-slate-700">{frameCount} frame(s) recorded.</p>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={onStart} className="h-10 rounded-md border border-line text-sm font-semibold text-teal">Start</button>
      <button type="button" onClick={onStop} className="h-10 rounded-md border border-line text-sm font-semibold text-coral">Stop</button>
    </div>
  </>;
}
