import type { DetectionMode } from "@/lib/detection/detection-config";

export function DetectionModeToggle({ mode, onChange }: { mode: DetectionMode; onChange: (mode: DetectionMode) => void }) {
  return <div className="mb-4 flex justify-center" role="group" aria-label="Detection mode">{(["static", "dynamic"] as const).map((option) => <button key={option} type="button" onClick={() => onChange(option)} aria-pressed={mode === option} className={`h-10 px-5 text-sm font-semibold first:rounded-l-md last:rounded-r-md ${mode === option ? "bg-teal text-white" : "border border-line bg-white text-ink"}`}>{option === "static" ? "Static signs" : "Dynamic signs"}</button>)}</div>;
}
