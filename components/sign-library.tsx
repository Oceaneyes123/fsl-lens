"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { alphabetSigns, numberSigns } from "@/lib/signs";

export function SignLibrary() {
  const [tab, setTab] = useState<"alphabet" | "number">("alphabet");
  const [query, setQuery] = useState("");
  const activeSigns = tab === "alphabet" ? alphabetSigns : numberSigns;
  const filteredSigns = useMemo(
    () =>
      activeSigns.filter((sign) =>
        `${sign.displayName} ${sign.label}`.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [activeSigns, query],
  );

  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Learn Library</h1>
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search signs"
            className="h-10 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm text-ink"
          />
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        {(["alphabet", "number"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`h-10 rounded-md px-4 text-sm font-semibold ${
              tab === item ? "bg-teal text-white" : "border border-line text-slate-700"
            }`}
          >
            {item === "alphabet" ? "Alphabet" : "Numbers"}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredSigns.map((sign) => (
          <article key={sign.label} className="rounded-lg border border-line p-4">
            <div className="flex gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-mist text-3xl font-semibold text-teal">
                {sign.displayName}
              </div>
              <div>
                <h2 className="text-base font-semibold text-ink">{sign.displayName}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {sign.expectedHandCount} hand{sign.expectedHandCount === 1 ? "" : "s"} expected
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">{sign.shortInstruction}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
