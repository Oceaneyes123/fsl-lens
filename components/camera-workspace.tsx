"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, HandMetal, RefreshCcw, Save, Settings, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CameraTracker, type LandmarkSnapshot } from "@/components/camera-tracker";
import { formatPredictedSign, signs } from "@/lib/signs";
import { createPredictionTracker } from "@/lib/prediction";
import { validateSampleQuality } from "@/lib/sample-quality";
import { loadRecognitionModel, saveFeedback, saveLandmarkSample } from "@/lib/supabase";
import { buildFeedbackInsert } from "@/lib/feedback";
import { areLandmarksInsideGuideFrame, areLandmarksSteady, type NormalizedLandmark } from "@/lib/landmarks";
import {
  createIdleRecognitionResult,
  createNoModelResult,
  recognizeLandmarks,
  type KnnModel,
  type RecognitionResult,
} from "@/lib/recognition";

type CameraWorkspaceProps = {
  mode: "recognize" | "capture" | "practice";
};

export function CameraWorkspace({ mode }: CameraWorkspaceProps) {
  const [selectedLabel, setSelectedLabel] = useState(signs[0]?.label ?? "");
  const [snapshot, setSnapshot] = useState<LandmarkSnapshot | null>(null);
  const [mirror, setMirror] = useState(true);
  const [overlay, setOverlay] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [lastSampleId, setLastSampleId] = useState<string | null>(null);
  const [model, setModel] = useState<KnnModel | null>(null);
  const [modelMessage, setModelMessage] = useState("Loading recognition model...");
  const [recognition, setRecognition] = useState<RecognitionResult>(() =>
    createNoModelResult("Loading recognition model..."),
  );
  const [insideGuideFrame, setInsideGuideFrame] = useState(false);
  const [steady, setSteady] = useState(false);
  const [practiceResult, setPracticeResult] = useState<"idle" | "correct" | "wrong">("idle");
  const trackerRef = useRef(createPredictionTracker({ requiredFrames: 5 }));
  const historyRef = useRef<NormalizedLandmark[][][]>([]);

  const selectedSign = signs.find((sign) => sign.label === selectedLabel) ?? signs[0];
  const isPractice = mode === "practice";
  const requiredStableFrames = model?.thresholdConfig.requiredStableFrames ?? 5;
  const predictedSign = formatPredictedSign(recognition.predictedLabel);

  const quality = snapshot
    ? validateSampleQuality({
        detectedHandCount: snapshot.handCount,
        expectedHandCount: selectedSign.expectedHandCount,
        detectorConfidence: snapshot.confidence,
        landmarksVisible: snapshot.landmarks.length > 0,
        insideGuideFrame,
        steady,
      })
    : null;

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  useEffect(() => {
    let active = true;

    loadRecognitionModel().then((result) => {
      if (!active) {
        return;
      }

      setModel(result.model);
      setModelMessage(result.message);
      if (!result.model) {
        setRecognition(createNoModelResult(result.message));
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!snapshot) {
      historyRef.current = [];
      trackerRef.current.update(null);
      setInsideGuideFrame(false);
      setSteady(false);
      setRecognition(model ? createIdleRecognitionResult() : createNoModelResult(modelMessage));
      return;
    }

    historyRef.current = [...historyRef.current.slice(-4), snapshot.landmarks];
    const nextInsideGuideFrame = areLandmarksInsideGuideFrame(snapshot.landmarks);
    const nextSteady = areLandmarksSteady(historyRef.current);
    setInsideGuideFrame(nextInsideGuideFrame);
    setSteady(nextSteady);

    if (!model) {
      trackerRef.current.update(null);
      setRecognition(createNoModelResult(modelMessage));
      return;
    }

    const rawRecognition = recognizeLandmarks({
      model,
      landmarks: snapshot.landmarks,
      handCount: snapshot.handCount,
      handedness: snapshot.handedness,
    });
    const stableCandidate = rawRecognition.state === "confirmed" ? rawRecognition.predictedLabel : null;
    const stableState = trackerRef.current.update(stableCandidate);
    const confirmed = rawRecognition.state === "confirmed" && stableState.stable;

    setRecognition({
      ...rawRecognition,
      state: confirmed ? "confirmed" : rawRecognition.state === "confirmed" ? "uncertain" : rawRecognition.state,
      stable: stableState.stable,
      stableFrameCount: stableState.count,
      message: confirmed
        ? "Prediction confirmed."
        : rawRecognition.state === "confirmed"
          ? `Hold steady for confirmation (${stableState.count}/${requiredStableFrames}).`
          : rawRecognition.message,
    });
  }, [model, modelMessage, requiredStableFrames, snapshot]);

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

    if (result.ok) {
      setLastSampleId(result.sampleId);
    }

    setSaveMessage(result.ok ? "Landmark sample saved to Supabase." : result.message);
  }

  async function handleFeedback(wasCorrect: boolean) {
    if (!sessionId) {
      setFeedbackMessage("Feedback is not ready until the anonymous session starts.");
      return;
    }

    const result = await saveFeedback(
      buildFeedbackInsert({
        sessionId,
        predictedLabel: recognition.predictedLabel,
        expectedLabel: isPractice ? selectedSign.label : null,
        confidence: recognition.confidence,
        topPredictions: recognition.topPredictions,
        wasCorrect,
        sampleId: lastSampleId,
      }),
    );

    setFeedbackMessage(result.message);
  }

  function chooseRandomSign() {
    const next = signs[Math.floor(Math.random() * signs.length)];
    setSelectedLabel(next.label);
    setPracticeResult("idle");
  }

  function handleCheckSign() {
    if (recognition.state !== "confirmed" || !recognition.stable) {
      setPracticeResult("wrong");
      return;
    }

    setPracticeResult(recognition.predictedLabel === selectedSign.label ? "correct" : "wrong");
  }

  return (
    <AppShell>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
        <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-ink">
                {mode === "capture" ? "Dataset Capture" : mode === "practice" ? "Practice Sign" : "Recognize Sign"}
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

          <div
            data-testid="predicted-sign-display"
            className="mx-auto mt-5 flex min-h-32 max-w-[410px] flex-col items-center justify-center rounded-md border-4 border-coral bg-white px-6 py-5 text-center"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{predictedSign.type}</p>
            <p data-testid="predicted-sign-value" className="mt-2 text-6xl font-bold leading-none text-ink sm:text-7xl">
              {predictedSign.value}
            </p>
          </div>
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
                  {recognition.state === "no_model"
                    ? "No model loaded"
                    : recognition.predictedLabel?.replace("_", " ") ?? "Unknown"}
                </p>
                <p className="text-sm text-slate-600">{recognition.message}</p>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex justify-between text-sm font-medium text-slate-700">
                <span>Confidence</span>
                <span>{Math.round(recognition.confidence * 100)}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-teal"
                  style={{ width: `${Math.round(recognition.confidence * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Stability: {recognition.stableFrameCount}/{requiredStableFrames} frames
              </p>
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-semibold text-ink">Top 3 suggestions</h3>
              <div className="mt-3 space-y-2">
                {recognition.topPredictions.length === 0 ? (
                  <p className="text-sm text-slate-600">{recognition.state === "no_model" ? modelMessage : "No hand detected yet."}</p>
                ) : (
                  recognition.topPredictions.map((item) => (
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
                {quality?.reasons[0] ?? (recognition.state === "no_model" ? modelMessage : selectedSign.commonMistakes)}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFeedback(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line text-sm font-semibold text-teal"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                Correct
              </button>
              <button
                type="button"
                onClick={() => handleFeedback(false)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line text-sm font-semibold text-coral"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Wrong
              </button>
            </div>
            {feedbackMessage ? <p className="mt-3 text-sm leading-6 text-slate-600">{feedbackMessage}</p> : null}
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
            {isPractice ? (
              <div className="mt-4 rounded-md border border-line bg-mist p-3">
                <p className="text-sm font-semibold text-ink">
                  {practiceResult === "idle"
                    ? "Waiting for check"
                    : practiceResult === "correct"
                      ? "Correct"
                      : "Try again"}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {practiceResult === "idle"
                    ? "Hold the target sign until the prediction is stable, then check it."
                    : practiceResult === "correct"
                      ? "The stable prediction matches the selected target."
                      : "The stable prediction does not match the selected target yet."}
                </p>
              </div>
            ) : null}
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
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={handleCheckSign}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal text-sm font-semibold text-white"
                >
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  Check Sign
                </button>
                {isPractice ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPracticeResult("idle")}
                      className="h-10 rounded-md border border-line text-sm font-semibold text-slate-700"
                    >
                      Try Again
                    </button>
                    <button
                      type="button"
                      onClick={chooseRandomSign}
                      className="h-10 rounded-md border border-line text-sm font-semibold text-teal"
                    >
                      Next Sign
                    </button>
                  </div>
                ) : null}
              </div>
            )}
            {saveMessage ? <p className="mt-3 text-sm leading-6 text-slate-600">{saveMessage}</p> : null}
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

function getOrCreateSessionId() {
  const key = "fsl-lens-session-id";
  const existing = window.sessionStorage.getItem(key);

  if (existing) {
    return existing;
  }

  const next = window.crypto.randomUUID();
  window.sessionStorage.setItem(key, next);
  return next;
}
