export function ContributorConsentCard({ consent, onChange }: { consent: boolean; onChange: (value: boolean) => void }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <h2 className="font-semibold text-ink">Privacy and consent</h2>
      <p className="mt-2 text-sm text-slate-600">FSL Lens saves hand landmarks, not raw photos or video. Contributions are reviewed before training use.</p>
      <label className="mt-4 flex items-start gap-2 text-sm">
        <input type="checkbox" checked={consent} onChange={(event) => onChange(event.target.checked)} className="mt-1" />
        I consent to contributing landmark data for FSL model research.
      </label>
    </section>
  );
}

