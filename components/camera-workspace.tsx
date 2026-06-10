"use client";

import { useMemo, useState } from "react";
import { Camera, Check, HandMetal, RefreshCcw, Save, Settings, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CameraTracker, type LandmarkSnapshot } from "@/components/camera-tracker";
import { signs } from "@/lib/signs";
import { evaluatePrediction } from "@/lib/prediction";
import { validateSampleQuality } from "@/lib/sample-quality";
import { saveLandmarkSample } from "@/lib/supabase";

type CameraWorkspaceProps = {
  mode: "recognize" | "capture";
};

export function CameraWorkspace({ mode }: CameraWorkspaceProps) {
  const [selectedLabel, setSelectedLabel] = useState(signs[0].label);
  const [snapshot, setSnapshot] = useState<LandmarkSnapshot | null>(null);
  const [mirror, setMirror] = useState(true);
  const [overlay, setOverlay] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");

  const selectedSign = signs.find((sign) => sign.label === selectedLabel) ?? signs[0];
  const prediction = useMemo(
    () =>
      evaluatePrediction({
        predictions: snapshot
          ? [
              { label: selectedSign.label, confidence: snapshot.confidence },
              { label: signs[1].label, confidence: Math.max(0.2, snapshot.confidence - 0.18) },
              { label: signs[2].label, confidence: Math.max(0.1, snapshot.confidence - 0.31) },
            ]
          : [],
      }),
    [selectedSign.label, snapshot],
  );

  const quality = snapshot
    ? validateSampleQuality({
        detectedHandCount: snapshot.handCount,
        expectedHandCount: selectedSign.expectedHandCount,
        detectorConfidence: snapshot.confidence,
        landmarksVisible: snapshot.landmarks.length > 0,
        insideGuideFrame: true,
        steady: true,
      })
    : null;

  async function handleSaveSample() {
    if (!snapshot) {
      setSaveMessage("Start the camera and place your hand inside the frame before saving.");
      return;
    }

    const result = await saveLandmarkSample({
      sign_id: selectedSign.id,
      session_id: window.crypto.randomUUID(),
      landmarks_json: snapshot.landmarks,
      hand_count: snapshot.handCount,
      handedness: snapshot.handedness,
      detector_confidence: snapshot.confidence,
      camera_type: "browser_webcam",
      lighting_note: "not_recorded",
      quality_status: quality?.status ?? "rejected",
      review_status: "pending",
      consent_raw_image: false,
      raw_image_url: null,
    });

    setSaveMessage(result.ok ? "Landmark sample saved to Supabase." : result.message);
  }

  return (
    <AppShell>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
        <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-ink">
                {mode === "capture" ? "Dataset Capture" : "Recognize Sign"}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Camera access starts only after you press Start Camera.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOverlay((value) => !value)}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-line px-3 text-sm font-medium text-slate-700"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                Overlay {overlay ? "On" : "Off"}
              </button>
              <button
                type="button"
                onClick={() => setMirror((value) => !value)}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-line px-3 text-sm font-medium text-slate-700"
              >
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                Mirror {mirror ? "On" : "Off"}
              </button>
            </div>
          </div>

          <CameraTracker mirror={mirror} overlay={overlay} onSnapshot={setSnapshot} />
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Prediction</h2>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-md bg-coral text-white">
                <HandMetal className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-2xl font-semibold text-ink">
                  {prediction.state === "unknown" ? "Unknown" : selectedSign.displayName}
                </p>
                <p className="text-sm text-slate-600">{prediction.message}</p>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex justify-between text-sm font-medium text-slate-700">
                <span>Confidence</span>
                <span>{Math.round((snapshot?.confidence ?? 0) * 100)}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-teal"
                  style={{ width: `${Math.round((snapshot?.confidence ?? 0) * 100)}%` }}
                />
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-semibold text-ink">Top 3 suggestions</h3>
              <div className="mt-3 space-y-2">
                {prediction.topPredictions.length === 0 ? (
                  <p className="text-sm text-slate-600">No hand detected yet.</p>
                ) : (
                  prediction.topPredictions.map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-md bg-mist px-3 py-2">
                      <span className="text-sm font-medium text-ink">{item.label.replace("_", " ")}</span>
                      <span className="text-sm text-slate-600">{Math.round(item.confidence * 100)}%</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-5 rounded-md border border-coral/30 bg-coral/5 p-3">
              <p className="text-sm font-semibold text-coral">Correction tip</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                {quality?.reasons[0] ?? selectedSign.commonMistakes}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line text-sm font-semibold text-teal">
                <Check className="h-4 w-4" aria-hidden="true" />
                Correct
              </button>
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line text-sm font-semibold text-coral">
                <X className="h-4 w-4" aria-hidden="true" />
                Wrong
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">
              {mode === "capture" ? "Capture sample" : "Practice target"}
            </h2>
            <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="sign">
              Sign label
            </label>
            <select
              id="sign"
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
            <p className="mt-3 text-sm leading-6 text-slate-600">{selectedSign.shortInstruction}</p>
            {mode === "capture" ? (
              <button
                type="button"
                onClick={handleSaveSample}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal text-sm font-semibold text-white"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                Save Landmark Sample
              </button>
            ) : (
              <button
                type="button"
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal text-sm font-semibold text-white"
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
                Check Sign
              </button>
            )}
            {saveMessage ? <p className="mt-3 text-sm leading-6 text-slate-600">{saveMessage}</p> : null}
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
