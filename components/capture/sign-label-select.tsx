import type { Sign } from "@/lib/signs";

export function SignLabelSelect({ signs, selectedLabel, onChange }: { signs: Sign[]; selectedLabel: string; onChange: (label: string) => void }) {
  return <>
    <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="sign">Sign label</label>
    <select id="sign" value={selectedLabel} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink">
      {signs.map((sign) => <option key={sign.label} value={sign.label}>{sign.displayName} - {sign.type}</option>)}
    </select>
  </>;
}
