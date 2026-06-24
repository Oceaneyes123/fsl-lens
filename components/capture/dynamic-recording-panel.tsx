export function DynamicRecordingPanel({ frameCount, onStart, onStop }: { frameCount: number; onStart: () => void; onStop: () => void }) {
  return <div className="grid grid-cols-2 gap-2"><button type="button" onClick={onStart} className="h-10 rounded-md border border-line text-sm font-semibold text-teal">Start</button><button type="button" onClick={onStop} className="h-10 rounded-md border border-line text-sm font-semibold text-coral">Stop ({frameCount})</button></div>;
}
