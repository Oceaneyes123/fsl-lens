"use client";

import { useMemo, useState } from "react";
import { Hand, ImageIcon, Search } from "lucide-react";
import { alphabetSigns, numberSigns, type Sign } from "@/lib/signs";

function SignCard({ sign }: { sign: Sign }) {
  const [imageError, setImageError] = useState(false);

  return (
    <article className="rounded-lg border border-line p-4 transition hover:border-teal/40 hover:shadow-sm">
      <div className="flex gap-4">
        {/* Reference image or placeholder */}
        {sign.referenceImageUrl && !imageError ? (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-mist">
            <img
              src={sign.referenceImageUrl}
              alt={`Reference for FSL sign ${sign.displayName}`}
              className="h-full w-full object-contain"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          </div>
        ) : (
          <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-md bg-mist">
            <Hand className="mb-1 h-6 w-6 text-teal/40" aria-hidden="true" />
            <span className="text-lg font-bold text-teal">{sign.displayName}</span>
          </div>
        )}
        <div className="flex-1">
          <h2 className="text-base font-semibold text-ink">{sign.displayName}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[11px] font-medium text-teal">
              {sign.type}
            </span>
            <span className="text-[11px] text-slate-500">
              {sign.expectedHandCount} hand{sign.expectedHandCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{sign.shortInstruction}</p>
      <p className="mt-1.5 text-xs italic text-slate-400">{sign.commonMistakes}</p>
    </article>
  );
}

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
          <p className="mt-1 text-sm text-slate-500">
            Browse and learn FSL signs. Reference images will appear when available.
          </p>
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
            {item === "alphabet" ? `Alphabet (${alphabetSigns.length})` : `Numbers (${numberSigns.length})`}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredSigns.length > 0 ? (
          filteredSigns.map((sign) => <SignCard key={sign.label} sign={sign} />)
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
            <ImageIcon className="h-10 w-10" aria-hidden="true" />
            <p className="mt-3 text-sm">No signs match your search.</p>
          </div>
        )}
      </div>
    </section>
  );
}
