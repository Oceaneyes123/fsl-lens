import { Plus } from "lucide-react";

export function WordSignForm({ value, message, onChange, onSubmit }: {
  value: string;
  message: string;
  onChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return <form onSubmit={onSubmit} className="mt-4">
    <label className="block text-sm font-medium text-slate-700" htmlFor="word-sign">Add word sign</label>
    <div className="mt-2 flex gap-2">
      <input id="word-sign" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Example: Thank you" className="h-11 min-w-0 flex-1 rounded-md border border-line bg-white px-3 text-sm text-ink" />
      <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink px-3 text-sm font-semibold text-white"><Plus className="h-4 w-4" aria-hidden="true" />Add</button>
    </div>
    {message ? <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p> : null}
  </form>;
}
