import type { Sign } from "@/lib/signs";

export function PracticeSignGrid({ signs, selectedLabel, active, onSelect }: {
  signs: Sign[];
  selectedLabel: string;
  active: boolean;
  onSelect: (label: string) => void;
}) {
  return <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
    <h1 className="text-xl font-semibold text-ink">Practice Sign</h1>
    <div className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-9 lg:grid-cols-12">
      {signs.map((sign) => <button key={sign.label} type="button" onClick={() => onSelect(sign.label)} className={`flex aspect-square items-center justify-center rounded-md border text-2xl font-bold ${sign.label === selectedLabel && active ? "border-teal bg-teal text-white" : "border-line bg-white text-ink"}`} aria-pressed={sign.label === selectedLabel && active}>{sign.displayName}</button>)}
    </div>
  </section>;
}
