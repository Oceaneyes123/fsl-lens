"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, HandMetal, Plus, RefreshCcw, Save, Settings, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CameraTracker, type LandmarkSnapshot } from "@/components/camera-tracker";
import { createWordSign, formatPredictedSigns, signs } from "@/lib/signs";
import { createDynamicFrameBuffer, summarizeDynamicRecording, type RecordedDynamicFrame } from "@/lib/dynamic-capture";
import { recognizeDynamicSequence } from "@/lib/dynamic-recognition";
import { detectionSettings, type DetectionMode } from "@/lib/detection-config";
import { createPredictionTracker } from "@/lib/prediction";
import { validateSampleQuality } from "@/lib/sample-quality";
import { areLandmarksInsideGuideFrame, areLandmarksSteady, type NormalizedLandmark } from "@/lib/landmarks";
import {
  createIdleRecognitionResult,
  createNoModelResult,
  recognizeLandmarks,
  type RecognitionResult,
} from "@/lib/recognition";
import { DetectionModeRouter } from "@/lib/recognize-mode-recognition";
import { useRecognitionModels } from "@/hooks/use-recognition-models";
import { useSampleCapture } from "@/hooks/use-sample-capture";
import { useFeedback } from "@/hooks/use-feedback";

export type CameraWorkspaceMode = "recognize" | "capture" | "practice";

export function CameraWorkspaceCore({ mode }: { mode: CameraWorkspaceMode }) {
  const [selectedLabel, setSelectedLabel] = useState(signs[0]?.label ?? "");
  const [customSigns, setCustomSigns] = useState<typeof signs>([]);
  const [wordInput, setWordInput] = useState("");
  const [wordMessage, setWordMessage] = useState("");
  const [snapshot, setSnapshot] = useState<LandmarkSnapshot | null>(null);
  const [mirror, setMirror] = useState(true);
  const [overlay, setOverlay] = useState(true);
  const { saveMessage, setSaveMessage, saveStatic, saveDynamic } = useSampleCapture();
  const { feedbackMessage, setFeedbackMessage, submit: submitFeedback } = useFeedback();
  const [sessionId, setSessionId] = useState("");
  const [lastSampleId, setLastSampleId] = useState<string | null>(null);
  const { model, dynamicModel, modelMessage, dynamicModelMessage } = useRecognitionModels();
  const [detectionMode, setDetectionMode] = useState<DetectionMode>(detectionSettings.defaultMode);
  const [recognition, setRecognition] = useState<RecognitionResult>(() =>
    createNoModelResult("Loading recognition model..."),
  );
  const [insideGuideFrame, setInsideGuideFrame] = useState(false);
  const [steady, setSteady] = useState(false);
  const [practiceCameraOpen, setPracticeCameraOpen] = useState(false);
  const [isRecordingDynamicSample, setIsRecordingDynamicSample] = useState(false);
  const [dynamicRecording, setDynamicRecording] = useState<RecordedDynamicFrame[]>([]);
  const trackerRef = useRef(createPredictionTracker({ requiredFrames: 5 }));
  const dynamicTrackerRef = useRef(createPredictionTracker({ requiredFrames: 2 }));
  const historyRef = useRef<NormalizedLandmark[][][]>([]);
  const dynamicFrameBufferRef = useRef(createDynamicFrameBuffer({ maxFrames: 45 }));
  const recognitionRouterRef = useRef(new DetectionModeRouter());

  const availableSigns = useMemo(() => [...signs, ...customSigns], [customSigns]);
  const practiceSigns = useMemo(
    () => availableSigns.filter((sign) => sign.type === "alphabet" || sign.type === "number"),
    [availableSigns],
  );
  const selectedSign = availableSigns.find((sign) => sign.label === selectedLabel) ?? availableSigns[0];
  const isPractice = mode === "practice";
  const isDynamicSign = selectedSign?.modality === "dynamic";
  const requiredStableFrames = isDynamicSign
    ? (dynamicModel?.thresholdConfig.requiredStableSequences ?? 2)
    : (model?.thresholdConfig.requiredStableFrames ?? 5);
  const predictedSign = formatPredictedSigns(recognition.topPredictions);

  const quality = snapshot
    ? validateSampleQuality({
        detectedHandCount: snapshot.handCount,
        expectedHandCount: selectedSign.expectedHandCount,
        detectorConfidence: snapshot.confidence,
        landmarksVisible: snapshot.landmarks.length > 0,
        insideGuideFrame,
        steady,
        requireSteady: !isDynamicSign,
      })
    : null;

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  useEffect(() => {
    if (mode !== "capture") {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      const isEditableTarget = isEditableEventTarget(target);

      if (event.repeat || isEditableTarget) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        void handleSaveSample();
        return;
      }

      const shortcutLabel = findCaptureShortcutLabel(event.key, availableSigns);
      if (shortcutLabel) {
        event.preventDefault();
        setSelectedLabel(shortcutLabel);
        setSaveMessage("");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [availableSigns, mode, handleSaveSample]);

  useEffect(() => {
    if (model) recognitionRouterRef.current.loadStaticModel(model);
    else setRecognition(createNoModelResult(modelMessage));
  }, [model, modelMessage]);

  useEffect(() => {
    if (dynamicModel) recognitionRouterRef.current.loadDynamicModel(dynamicModel);
  }, [dynamicModel]);

  useEffect(() => {
    recognitionRouterRef.current.setMode(detectionMode);
    setRecognition(createIdleRecognitionResult(
      detectionMode === "static" ? "Place your hand inside the camera frame." : "Move through the full sign inside the guide frame.",
    ));
  }, [detectionMode]);

  useEffect(() => {
    trackerRef.current.update(null);
    dynamicTrackerRef.current.update(null);
    dynamicFrameBufferRef.current.clear();
    setDynamicRecording([]);
    setIsRecordingDynamicSample(false);
  }, [selectedLabel]);

  useEffect(() => {
    if (!snapshot) {
      recognitionRouterRef.current.predict(null);
      historyRef.current = [];
      trackerRef.current.update(null);
      dynamicTrackerRef.current.update(null);
      dynamicFrameBufferRef.current.clear();
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

    if (mode === "recognize") {
      setRecognition(recognitionRouterRef.current.predict(snapshot));
      return;
    }

    if (isDynamicSign) {
      dynamicFrameBufferRef.current.add(snapshot.landmarks);

      if (isRecordingDynamicSample) {
        setDynamicRecording((frames) =>
          [...frames, { frame: snapshot.landmarks, confidence: snapshot.confidence }].slice(-90),
        );
      }

      if (!dynamicModel) {
        dynamicTrackerRef.current.update(null);
        setRecognition(createNoModelResult(dynamicModelMessage));
        return;
      }

      const frames = dynamicFrameBufferRef.current.frames();
      if (frames.length < 2) {
        dynamicTrackerRef.current.update(null);
        setRecognition(createIdleRecognitionResult("Move through the full sign inside the guide frame."));
        return;
      }

      const rawRecognition = recognizeDynamicSequence({
        model: dynamicModel,
        frames,
        handCount: snapshot.handCount,
      });
      const stableCandidate = rawRecognition.state === "confirmed" ? rawRecognition.predictedLabel : null;
      const stableState = dynamicTrackerRef.current.update(stableCandidate);
      const confirmed = rawRecognition.state === "confirmed" && stableState.stable;

      setRecognition({
        ...rawRecognition,
        state: confirmed ? "confirmed" : rawRecognition.state === "confirmed" ? "uncertain" : rawRecognition.state,
        stable: stableState.stable,
        stableFrameCount: stableState.count,
        message: confirmed
          ? "Dynamic prediction confirmed."
          : rawRecognition.state === "confirmed"
            ? `Repeat the motion for confirmation (${stableState.count}/${requiredStableFrames}).`
            : rawRecognition.message,
      });
      return;
    }

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
  }, [dynamicModel, dynamicModelMessage, isDynamicSign, isRecordingDynamicSample, model, modelMessage, requiredStableFrames, snapshot]);

  async function handleSaveSample() {
    if (isDynamicSign) {
      await handleSaveDynamicSample();
      return;
    }

    if (!snapshot) {
      setSaveMessage("Start the camera and place your hand inside the frame before saving.");
      return;
    }

    const result = await saveStatic({
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

  }

  async function handleSaveDynamicSample() {
    if (!snapshot || dynamicRecording.length < 2) {
      setSaveMessage("Record the full dynamic sign before saving.");
      return;
    }

    const recording = summarizeDynamicRecording(dynamicRecording);
    const result = await saveDynamic({
      sign_id: selectedSign.id,
      session_id: window.crypto.randomUUID(),
      frames_json: recording.frames,
      frame_count: recording.frameCount,
      fps: 15,
      hand_count: snapshot.handCount,
      handedness: snapshot.handedness,
      detector_confidence: recording.averageConfidence,
      camera_type: "browser_webcam",
      lighting_note: "not_recorded",
      quality_status: quality?.status ?? "rejected",
      review_status: "pending",
      signer_id: null,
      consent_raw_image: false,
      raw_image_url: null,
    });

    if (result.ok) {
      setLastSampleId(null);
      setDynamicRecording([]);
      setIsRecordingDynamicSample(false);
    }

  }

  async function handleFeedback(wasCorrect: boolean) {
    if (!sessionId) {
      setFeedbackMessage("Feedback is not ready until the anonymous session starts.");
      return;
    }

    const result = await submitFeedback({
      session_id: sessionId,
      predicted_sign_id: recognition.predictedLabel,
      expected_sign_id: isPractice ? selectedSign.label : null,
      confidence: recognition.confidence,
      top_predictions_json: recognition.topPredictions,
      was_correct: wasCorrect,
      sample_id: lastSampleId,
    });

  }

  function handleAddWordSign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = wordInput.trim();
    if (!value) {
      setWordMessage("Enter a word before adding it.");
      return;
    }

    const nextSign = createWordSign(value);
    if (nextSign.label === "word_") {
      setWordMessage("Use at least one letter or number for the word sign.");
      return;
    }

    if (!availableSigns.some((sign) => sign.label === nextSign.label)) {
      setCustomSigns((currentSigns) => [...currentSigns, nextSign]);
    }

    setSelectedLabel(nextSign.label);
    setWordInput("");
    setWordMessage(`${nextSign.displayName} added to the training list.`);
  }

  if (mode === "recognize") {
    return (
      <AppShell>
        <div className="mb-4 flex justify-center" role="group" aria-label="Detection mode">
          {(["static", "dynamic"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDetectionMode(option)}
              aria-pressed={detectionMode === option}
              className={`h-10 px-5 text-sm font-semibold first:rounded-l-md last:rounded-r-md ${
                detectionMode === option ? "bg-teal text-white" : "border border-line bg-white text-ink"
              }`}
            >
              {option === "static" ? "Static signs" : "Dynamic signs"}
            </button>
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_430px]">
          <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
            <CameraTracker autoStart mirror={mirror} overlay={overlay} onSnapshot={setSnapshot} />
          </section>

          <section className="flex min-h-[360px] flex-col rounded-lg border border-line bg-white p-6 shadow-soft">
            {/* Prediction state indicator */}
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{predictedSign.type}</p>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  recognition.state === "confirmed"
                    ? "bg-emerald-50 text-emerald-700"
                    : recognition.state === "uncertain"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-slate-50 text-slate-500"
                }`}
              >
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                    recognition.state === "confirmed"
                      ? "bg-emerald-500"
                      : recognition.state === "uncertain"
                        ? "bg-amber-500"
                        : "bg-slate-400"
                  }`}
                />
                {recognition.state === "confirmed"
                  ? "Confirmed"
                  : recognition.state === "uncertain"
                    ? "Uncertain"
                    : "Waiting"}
              </span>
            </div>

            {/* Main predicted sign */}
            <div className="mt-4 flex flex-1 flex-col items-center justify-center">
              <p
                data-testid="predicted-sign-value"
                className={`font-bold leading-none ${
                  predictedSign.value === "Unknown" ? "text-5xl sm:text-6xl text-slate-400" : "text-7xl sm:text-8xl text-ink"
                }`}
              >
                {predictedSign.value}
              </p>

              {/* Confidence bar for top prediction */}
              {recognition.topPredictions.length > 0 && (
                <div className="mt-4 w-full max-w-[200px]">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${
                        recognition.state === "confirmed"
                          ? "bg-emerald-500"
                          : recognition.state === "uncertain"
                            ? "bg-amber-500"
                            : "bg-slate-300"
                      }`}
                      style={{ width: `${Math.round(recognition.confidence * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-center text-xs text-slate-500">
                    {Math.round(recognition.confidence * 100)}% confidence
                  </p>
                </div>
              )}

              {/* Stable frame progress for recognition */}
              {recognition.stableFrameCount > 0 && recognition.state !== "confirmed" && (
                <p className="mt-2 text-xs text-slate-400">
                  Hold stable ({recognition.stableFrameCount}/{requiredStableFrames})
                </p>
              )}
            </div>

            {/* Quality indicators */}
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
              <div className="flex flex-col items-center gap-1">
                <span className={insideGuideFrame ? "text-emerald-500" : "text-slate-400"}>
                  {insideGuideFrame ? "✓" : "○"}
                </span>
                <span className="text-[10px] font-medium text-slate-500">Guide</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className={steady ? "text-emerald-500" : "text-slate-400"}>
                  {steady ? "✓" : "○"}
                </span>
                <span className="text-[10px] font-medium text-slate-500">Steady</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className={snapshot ? "text-emerald-500" : "text-slate-400"}>
                  {snapshot ? "✓" : "○"}
                </span>
                <span className="text-[10px] font-medium text-slate-500">Hand</span>
              </div>
            </div>

            {/* Top-3 predictions mini chart */}
            {recognition.topPredictions.length > 1 && (
              <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Top candidates</p>
                {recognition.topPredictions.slice(0, 3).map((prediction, index) => (
                  <div key={prediction.label} className="flex items-center gap-2">
                    <span className="w-6 text-right text-[11px] font-medium text-slate-600">
                      {index === 0 ? "1st" : index === 1 ? "2nd" : "3rd"}
                    </span>
                    <div className="flex flex-1 items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-teal/60 transition-all duration-200"
                          style={{ width: `${Math.round(prediction.confidence * 100)}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-[11px] font-medium text-slate-500">
                        {Math.round(prediction.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </AppShell>
    );
  }

  if (mode === "practice") {
    const practiceHasVerdict = Boolean(practiceCameraOpen && snapshot && recognition.state !== "unknown" && recognition.state !== "no_model");
    const practiceIsCorrect =
      practiceHasVerdict &&
      recognition.state === "confirmed" &&
      recognition.stable &&
      recognition.predictedLabel === selectedSign.label;

    return (
      <AppShell>
        <div className="space-y-5">
          <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <h1 className="text-xl font-semibold text-ink">Practice Sign</h1>
            <div className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-9 lg:grid-cols-12">
              {practiceSigns.map((sign) => (
                <button
                  key={sign.label}
                  type="button"
                  onClick={() => {
                    setSelectedLabel(sign.label);
                    setPracticeCameraOpen(true);
                  }}
                  className={`flex aspect-square items-center justify-center rounded-md border text-2xl font-bold ${
                    sign.label === selectedSign.label && practiceCameraOpen
                      ? "border-teal bg-teal text-white"
                      : "border-line bg-white text-ink"
                  }`}
                  aria-pressed={sign.label === selectedSign.label && practiceCameraOpen}
                >
                  {sign.displayName}
                </button>
              ))}
            </div>
          </section>

          {practiceCameraOpen ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
                <CameraTracker autoStart mirror={mirror} overlay={overlay} onSnapshot={setSnapshot} />
              </section>
              <section className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-line bg-white p-6 text-center shadow-soft">
                <p className="text-7xl font-bold leading-none text-ink sm:text-8xl">{selectedSign.displayName}</p>
                <div className="mt-6 flex h-36 w-36 items-center justify-center">
                  {practiceHasVerdict ? (
                    practiceIsCorrect ? (
                      <Check className="h-32 w-32 text-teal" strokeWidth={3} aria-label="Correct" />
                    ) : (
                      <X className="h-32 w-32 text-coral" strokeWidth={3} aria-label="Incorrect" />
                    )
                  ) : (
                    <div className="h-24 w-24 rounded-full border-4 border-dashed border-slate-300" aria-label="Waiting" />
                  )}
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
        <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-ink">Dataset Capture</h1>
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

          <CameraTracker autoStart mirror={mirror} overlay={overlay} onSnapshot={setSnapshot} />

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
            <h2 className="text-lg font-semibold text-ink">Capture sample</h2>
            <form onSubmit={handleAddWordSign} className="mt-4">
              <label className="block text-sm font-medium text-slate-700" htmlFor="word-sign">
                Add word sign
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="word-sign"
                  value={wordInput}
                  onChange={(event) => setWordInput(event.target.value)}
                  placeholder="Example: Thank you"
                  className="h-11 min-w-0 flex-1 rounded-md border border-line bg-white px-3 text-sm text-ink"
                />
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink px-3 text-sm font-semibold text-white"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add
                </button>
              </div>
              {wordMessage ? <p className="mt-2 text-sm leading-6 text-slate-600">{wordMessage}</p> : null}
            </form>
            <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="sign">
              Sign label
            </label>
            <select
              id="sign"
              value={selectedLabel}
              onChange={(event) => setSelectedLabel(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink"
            >
              {availableSigns.map((sign) => (
                <option key={sign.label} value={sign.label}>
                  {sign.displayName} - {sign.type}
                </option>
              ))}
            </select>
            {isDynamicSign ? (
              <div className="mt-3 rounded-md border border-line bg-mist p-3">
                <p className="text-sm font-semibold text-ink">Dynamic sign</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {`${dynamicRecording.length} frame(s) recorded.`}
                </p>
              </div>
            ) : null}
            <div className="mt-4 grid gap-2">
              {isDynamicSign ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDynamicRecording([]);
                      setIsRecordingDynamicSample(true);
                      setSaveMessage("Recording dynamic sign...");
                    }}
                    className="h-10 rounded-md border border-line text-sm font-semibold text-teal"
                  >
                    Start
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecordingDynamicSample(false);
                      setSaveMessage(`Recording stopped with ${dynamicRecording.length} frame(s).`);
                    }}
                    className="h-10 rounded-md border border-line text-sm font-semibold text-coral"
                  >
                    Stop
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                onClick={handleSaveSample}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal text-sm font-semibold text-white"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                {isDynamicSign ? "Save Dynamic Sequence" : "Save Landmark Sample"}
              </button>
            </div>
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

function isEditableEventTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

function findCaptureShortcutLabel(key: string, availableSigns: typeof signs) {
  const normalizedKey = key.length === 1 ? key.toUpperCase() : "";

  if (/^[A-Z]$/.test(normalizedKey)) {
    return availableSigns.find((sign) => sign.type === "alphabet" && sign.displayName === normalizedKey)?.label ?? null;
  }

  if (/^[0-9]$/.test(key)) {
    return availableSigns.find((sign) => sign.type === "number" && sign.displayName === key)?.label ?? null;
  }

  return null;
}
