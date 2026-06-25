import Link from "next/link";
import { Activity, BarChart3, CheckCircle2, FlaskConical, Hand, Play, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export default function HomePage() {
  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-line bg-panel p-6 shadow-soft lg:col-span-8">
          <h1 className="font-heading text-2xl font-bold leading-8 text-ink sm:text-[32px] sm:leading-10">
            Systems Operational.
          </h1>
          <p className="mt-2 max-w-2xl text-lg leading-7 text-muted">
            Model{" "}
            <code className="rounded bg-panelSoft px-1.5 py-0.5 font-mono text-xs text-primary">KNN Dynamic v0.1</code>{" "}
            is ready to process live Filipino Sign Language landmarks.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/recognize"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              Start Recognition
            </Link>
            <Link
              href="/capture"
              className="inline-flex h-11 items-center rounded-lg border border-primary px-5 text-sm font-semibold text-primary transition hover:bg-panelSoft"
            >
              Capture Sample
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-panel p-4 shadow-soft lg:col-span-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-xs font-semibold uppercase text-muted">Model Profile</h2>
            </div>
            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">v0.1.4</span>
          </div>
          <div className="relative aspect-video overflow-hidden rounded-lg border border-line bg-slate-950">
            <div className="absolute inset-[12%] rounded-lg border-2 border-primary" />
            <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-[10px] font-bold uppercase text-white">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Live
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Hand className="h-14 w-14 text-white/80" aria-hidden="true" />
            </div>
            <div className="absolute bottom-4 left-1/2 w-48 -translate-x-1/2">
              <div className="rounded-lg bg-primary px-5 py-2 text-center font-heading text-xl font-semibold text-white shadow-floating">YES</div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/20">
                <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-secondary to-primary" />
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <span className="text-xs font-medium text-muted">Vocabulary Coverage</span>
            <span className="font-heading text-xl font-semibold text-primary">42 <span className="font-body text-sm font-normal text-muted">Signs</span></span>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-line bg-panel shadow-soft lg:col-span-4">
          <div className="flex items-center justify-between border-b border-line bg-panelSoft px-4 py-3">
            <h2 className="text-sm font-semibold text-muted">Dataset Health</h2>
            <Link className="text-xs font-semibold text-primary hover:underline" href="/admin">View Report</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 p-4">
            <Metric label="Total Samples" value="1,248" />
            <Metric label="Weak Signs" value="17" tone="error" />
          </div>
          <div className="flex items-center gap-2 px-4 pb-4 text-sm text-muted">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            Confidence Score: 89.2%
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-line bg-panel shadow-soft lg:col-span-4">
          <div className="flex items-center justify-between border-b border-line bg-panelSoft px-4 py-3">
            <h2 className="text-sm font-semibold text-muted">ML Experiment</h2>
            <FlaskConical className="h-4 w-4 text-muted" aria-hidden="true" />
          </div>
          <div className="space-y-4 p-4">
            <div>
              <p className="text-xs font-medium text-muted">Baseline Model</p>
              <p className="text-base font-semibold text-ink">Transformer Small v2</p>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs font-semibold">
                <span className="text-muted">Top-1 Accuracy</span>
                <span className="text-secondary">61%</span>
              </div>
              <div className="h-8 rounded-lg bg-panelSoft p-1">
                <div className="h-full w-[61%] rounded-md bg-gradient-to-r from-secondary to-primary" />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-line bg-panel shadow-soft lg:col-span-4">
          <div className="border-b border-line bg-panelSoft px-4 py-3">
            <h2 className="text-sm font-semibold text-muted">Contributor Pipeline</h2>
          </div>
          <div className="space-y-5 p-4">
            <Pipeline icon={Activity} label="Pending Approval" value="24" tone="secondary" />
            <Pipeline icon={ShieldCheck} label="Verified Samples" value="1,100" tone="primary" />
          </div>
        </div>

        <div className="rounded-xl border border-line bg-panel p-6 shadow-soft lg:col-span-12">
          <div className="grid gap-6 md:grid-cols-[1fr_0.8fr] md:items-center">
            <div>
              <h2 className="font-heading text-2xl font-semibold leading-8 text-ink">Advanced Spatial Analysis</h2>
              <p className="mt-3 max-w-3xl text-base leading-6 text-muted">
                FSL Lens processes hand landmarks locally, then routes static and dynamic signs through lightweight recognition models for fast practice and dataset review.
              </p>
            </div>
            <div className="relative min-h-48 overflow-hidden rounded-xl border border-line bg-slate-950">
              <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
              <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/40" />
              <Hand className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-white/80" aria-hidden="true" />
              <div className="absolute bottom-4 left-4 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
                  <span className="h-2 w-2 rounded-full bg-secondary" />
                  Landmark Node
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Center of Mass
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Metric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "error" }) {
  return (
    <div className={`rounded-lg border p-4 ${tone === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-line bg-panelSoft text-ink"}`}>
      <p className="mb-1 text-xs font-medium text-muted">{label}</p>
      <p className="font-heading text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Pipeline({ icon: Icon, label, value, tone }: { icon: typeof Activity; label: string; value: string; tone: "primary" | "secondary" }) {
  return (
    <div className="flex items-center gap-4">
      <span className={`flex h-12 w-12 items-center justify-center rounded-full ${tone === "primary" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}>
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <span>
        <span className="block font-heading text-xl font-semibold leading-6 text-ink">{value}</span>
        <span className="block text-xs font-medium text-muted">{label}</span>
      </span>
    </div>
  );
}
