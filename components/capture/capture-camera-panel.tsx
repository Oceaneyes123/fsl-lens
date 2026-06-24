import { RefreshCcw, Settings } from "lucide-react";
import { CameraTracker, type LandmarkSnapshot } from "@/components/camera-tracker";

export function CaptureCameraPanel({ mirror, overlay, predictedSign, onMirrorChange, onOverlayChange, onSnapshot }: {
  mirror: boolean;
  overlay: boolean;
  predictedSign: { value: string; type: string };
  onMirrorChange: () => void;
  onOverlayChange: () => void;
  onSnapshot: (snapshot: LandmarkSnapshot | null) => void;
}) {
  return <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-xl font-semibold text-ink">Dataset Capture</h1></div>
      <div className="flex gap-2">
        <button type="button" onClick={onOverlayChange} className="inline-flex h-10 items-center gap-2 rounded-md border border-line px-3 text-sm font-medium text-slate-700">
          <Settings className="h-4 w-4" aria-hidden="true" />Overlay {overlay ? "On" : "Off"}
        </button>
        <button type="button" onClick={onMirrorChange} className="inline-flex h-10 items-center gap-2 rounded-md border border-line px-3 text-sm font-medium text-slate-700">
          <RefreshCcw className="h-4 w-4" aria-hidden="true" />Mirror {mirror ? "On" : "Off"}
        </button>
      </div>
    </div>
    <CameraTracker autoStart mirror={mirror} overlay={overlay} onSnapshot={onSnapshot} />
    <div data-testid="predicted-sign-display" className="mx-auto mt-5 flex min-h-32 max-w-[410px] flex-col items-center justify-center rounded-md border-4 border-coral bg-white px-6 py-5 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{predictedSign.type}</p>
      <p data-testid="predicted-sign-value" className="mt-2 text-6xl font-bold leading-none text-ink sm:text-7xl">{predictedSign.value}</p>
    </div>
  </section>;
}
