import type { ContributorMetadata } from "@/lib/dataset/contributor-metadata";

const fields = {
  dominant_hand: ["left", "right", "ambidextrous", "prefer_not_to_say"],
  experience_level: ["beginner", "intermediate", "fluent", "prefer_not_to_say"],
  device_type: ["mobile", "desktop", "tablet", "unknown"],
  camera_facing: ["front", "back", "webcam", "unknown"],
  lighting_quality: ["good", "medium", "poor", "unknown"],
} as const;

export function ContributorMetadataForm({ value, onChange }: { value: ContributorMetadata; onChange: (value: ContributorMetadata) => void }) {
  return (
    <fieldset className="grid gap-3 sm:grid-cols-2">
      <legend className="mb-2 text-sm font-semibold text-ink">Optional contributor context</legend>
      {(Object.keys(fields) as (keyof ContributorMetadata)[]).map((field) => (
        <label key={field} className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {field.replaceAll("_", " ")}
          <select value={value[field]} onChange={(event) => onChange({ ...value, [field]: event.target.value })} className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm normal-case text-slate-800">
            {fields[field].map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
          </select>
        </label>
      ))}
    </fieldset>
  );
}

