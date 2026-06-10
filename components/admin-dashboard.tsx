import { signs } from "@/lib/signs";

export function AdminDashboard() {
  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <h1 className="text-2xl font-semibold text-ink">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Internal review surfaces for samples, feedback, dataset versions, and model versions.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {[
          ["Active signs", signs.length],
          ["Sample review", "Pending"],
          ["Model version", "Not trained"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <p className="text-sm font-medium text-slate-600">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-lg font-semibold text-ink">Model versions</h2>
        </div>
        <div className="grid grid-cols-4 gap-4 px-5 py-3 text-sm font-semibold text-slate-600">
          <span>Version</span>
          <span>Dataset</span>
          <span>Status</span>
          <span>Accuracy</span>
        </div>
        <div className="grid grid-cols-4 gap-4 border-t border-line px-5 py-4 text-sm text-slate-700">
          <span>Waiting for first export</span>
          <span>No dataset version</span>
          <span>Draft</span>
          <span>Not available</span>
        </div>
      </div>
    </section>
  );
}
