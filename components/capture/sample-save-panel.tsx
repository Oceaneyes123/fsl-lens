import { Save } from "lucide-react";

export function SampleSavePanel({ dynamic, message, onSave }: { dynamic: boolean; message: string; onSave: () => void }) {
  return <>
    <button type="button" onClick={onSave} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal text-sm font-semibold text-white"><Save className="h-4 w-4" aria-hidden="true" />{dynamic ? "Save Dynamic Sequence" : "Save Landmark Sample"}</button>
    {message ? <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p> : null}
  </>;
}
