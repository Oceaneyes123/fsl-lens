"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { signs } from "@/lib/signs";

export function PracticePanel() {
  const [selectedLabel, setSelectedLabel] = useState(signs[0].label);
  const selectedSign = useMemo(
    () => signs.find((sign) => sign.label === selectedLabel) ?? signs[0],
    [selectedLabel],
  );

  function chooseRandomSign() {
    const next = signs[Math.floor(Math.random() * signs.length)];
    setSelectedLabel(next.label);
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <h1 className="text-2xl font-semibold text-ink">Practice Mode</h1>
        <label className="mt-5 block text-sm font-medium text-slate-700" htmlFor="practice-sign">
          Guided practice sign
        </label>
        <select
          id="practice-sign"
          value={selectedLabel}
          onChange={(event) => setSelectedLabel(event.target.value)}
          className="mt-2 h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink"
        >
          {signs.map((sign) => (
            <option key={sign.label} value={sign.label}>
              {sign.displayName} - {sign.type}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={chooseRandomSign}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-line text-sm font-semibold text-teal"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Random Quiz
        </button>
      </div>

      <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-5 md:flex-row">
          <div className="flex aspect-square w-full max-w-52 items-center justify-center rounded-lg bg-mist text-7xl font-semibold text-teal">
            {selectedSign.displayName}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-ink">Sign {selectedSign.displayName}</h2>
            <p className="mt-2 text-sm text-slate-600">
              Expected hand count: {selectedSign.expectedHandCount}
            </p>
            <p className="mt-4 text-base leading-7 text-slate-700">{selectedSign.shortInstruction}</p>
            <div className="mt-5 rounded-md border border-coral/30 bg-coral/5 p-4">
              <p className="text-sm font-semibold text-coral">Common correction</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{selectedSign.commonMistakes}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
