export function ContributorCapturePanel({ dynamic, recording, frameCount, attempts, disabled, message, onStart, onStop, onSubmit }: {
  dynamic: boolean; recording: boolean; frameCount: number; attempts: number; disabled: boolean; message: string;
  onStart: () => void; onStop: () => void; onSubmit: () => void;
}) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <h2 className="font-semibold text-ink">Capture attempts</h2>
      <p className="mt-1 text-sm text-slate-600">Submitted: {attempts}/5. Aim for at least 3 clear attempts.</p>
      {dynamic ? <div className="mt-4 flex items-center gap-2"><button type="button" onClick={recording ? onStop : onStart} className="rounded-md bg-slate-800 px-3 py-2 text-sm text-white">{recording ? "Stop recording" : "Record movement"}</button><span className="text-sm text-slate-500">{frameCount} frames</span></div> : null}
      <button type="button" disabled={disabled || attempts >= 5} onClick={onSubmit} className="mt-4 rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Submit landmark sample</button>
      {message ? <p className="mt-3 text-sm text-slate-600" role="status">{message}</p> : null}
    </section>
  );
}

