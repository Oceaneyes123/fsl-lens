import type { Sign } from "@/lib/signs";

export function ContributorSignList({ signs, selected, onSelect }: { signs: Sign[]; selected: string; onSelect: (label: string) => void }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      Target sign
      <select value={selected} onChange={(event) => onSelect(event.target.value)} className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2">
        {signs.map((sign) => <option key={sign.id} value={sign.label}>{sign.displayName} · {sign.modality}</option>)}
      </select>
    </label>
  );
}

