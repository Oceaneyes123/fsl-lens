export function SampleSavePanel({ dynamic, message, onSave }: { dynamic: boolean; message: string; onSave: () => void }) {
  return <div><button type="button" onClick={onSave} className="h-11 w-full rounded-md bg-teal text-sm font-semibold text-white">{dynamic ? "Save Dynamic Sequence" : "Save Landmark Sample"}</button>{message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}</div>;
}
