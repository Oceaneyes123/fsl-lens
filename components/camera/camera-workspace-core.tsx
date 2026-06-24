"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CameraTracker, type LandmarkSnapshot } from "@/components/camera-tracker";
import { CaptureCameraPanel } from "@/components/capture/capture-camera-panel";
import { CaptureFeedbackPanel } from "@/components/capture/capture-feedback-panel";
import { CapturePredictionPanel } from "@/components/capture/capture-prediction-panel";
import { DynamicRecordingPanel } from "@/components/capture/dynamic-recording-panel";
import { SampleSavePanel } from "@/components/capture/sample-save-panel";
import { SignLabelSelect } from "@/components/capture/sign-label-select";
import { WordSignForm } from "@/components/capture/word-sign-form";
import { createWordSign, formatPredictedSigns, signs } from "@/lib/signs";
import { buildDynamicSamplePayload } from "@/lib/dataset/dynamic-sample";
import { buildStaticSamplePayload } from "@/lib/dataset/static-sample";
import { createIdleRecognitionResult, createNoModelResult, type RecognitionResult } from "@/lib/recognition";
import { useRecognitionModels } from "@/hooks/use-recognition-models";
import { useSampleCapture } from "@/hooks/use-sample-capture";
import { useFeedback } from "@/hooks/use-feedback";
import { useDetectionRouter } from "@/hooks/use-detection-router";
import { useDynamicRecording } from "@/hooks/use-dynamic-recording";
import { useGuideQuality } from "@/hooks/use-guide-quality";
import { useSelectedSignRecognition } from "@/hooks/use-selected-sign-recognition";
import { DetectionModeToggle } from "@/components/recognition/detection-mode-toggle";
import { PredictionPanel } from "@/components/recognition/prediction-panel";
import { QualityIndicators } from "@/components/recognition/quality-indicators";
import { TopPredictions } from "@/components/recognition/top-predictions";
import { PracticeSignGrid } from "@/components/practice/practice-sign-grid";
import { PracticeVerdictPanel } from "@/components/practice/practice-verdict-panel";

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
  const { detectionMode, setDetectionMode, predictSnapshot, resetRouter } = useDetectionRouter({
    model,
    dynamicModel,
    modelMessage,
    dynamicModelMessage,
  });
  const [routedRecognition, setRoutedRecognition] = useState<RecognitionResult>(() =>
    createNoModelResult("Loading recognition model..."),
  );
  const [practiceCameraOpen, setPracticeCameraOpen] = useState(false);

  const availableSigns = useMemo(() => [...signs, ...customSigns], [customSigns]);
  const practiceSigns = useMemo(
    () => availableSigns.filter((sign) => sign.type === "alphabet" || sign.type === "number"),
    [availableSigns],
  );
  const selectedSign = availableSigns.find((sign) => sign.label === selectedLabel) ?? availableSigns[0];
  const isPractice = mode === "practice";
  const isDynamicSign = selectedSign?.modality === "dynamic";
  const {
    recording: dynamicRecording,
    start: startDynamicRecording,
    stop: stopDynamicRecording,
    reset: resetDynamicRecording,
    addFrame: addDynamicFrame,
    summarize: summarizeDynamicRecording,
  } = useDynamicRecording();
  const { insideGuideFrame, steady, quality } = useGuideQuality({ snapshot, selectedSign, isDynamicSign });
  const requiredStableFrames = isDynamicSign
    ? (dynamicModel?.thresholdConfig.requiredStableSequences ?? 2)
    : (model?.thresholdConfig.requiredStableFrames ?? 5);
  const { recognition: selectedSignRecognition } = useSelectedSignRecognition({
    snapshot: mode === "recognize" ? null : snapshot,
    selectedSign,
    isDynamicSign,
    model,
    dynamicModel,
    modelMessage,
    dynamicModelMessage,
    requiredStableFrames,
    addDynamicFrame,
  });
  const recognition = mode === "recognize" ? routedRecognition : selectedSignRecognition;
  const predictedSign = formatPredictedSigns(recognition.topPredictions);

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
    setRoutedRecognition(createIdleRecognitionResult(
      detectionMode === "static" ? "Place your hand inside the camera frame." : "Move through the full sign inside the guide frame.",
    ));
  }, [detectionMode]);

  useEffect(() => {
    resetDynamicRecording();
  }, [resetDynamicRecording, selectedLabel]);

  useEffect(() => {
    if (mode !== "recognize") return;
    if (!snapshot) {
      resetRouter();
      setRoutedRecognition(predictSnapshot(null));
      return;
    }
    setRoutedRecognition(predictSnapshot(snapshot));
  }, [mode, predictSnapshot, resetRouter, snapshot]);

  async function handleSaveSample() {
    if (isDynamicSign) {
      await handleSaveDynamicSample();
      return;
    }

    if (!snapshot) {
      setSaveMessage("Start the camera and place your hand inside the frame before saving.");
      return;
    }

    const result = await saveStatic(buildStaticSamplePayload({
      sign: selectedSign,
      snapshot,
      qualityStatus: quality?.status ?? "rejected",
      sessionId: window.crypto.randomUUID(),
    }));

    if (result.ok) {
      setLastSampleId(result.sampleId);
    }

  }

  async function handleSaveDynamicSample() {
    if (!snapshot || dynamicRecording.length < 2) {
      setSaveMessage("Record the full dynamic sign before saving.");
      return;
    }

    const recording = summarizeDynamicRecording();
    const result = await saveDynamic(buildDynamicSamplePayload({
      sign: selectedSign,
      snapshot,
      recording,
      qualityStatus: quality?.status ?? "rejected",
      sessionId: window.crypto.randomUUID(),
    }));

    if (result.ok) {
      setLastSampleId(null);
      resetDynamicRecording();
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
        <DetectionModeToggle mode={detectionMode} onChange={setDetectionMode} />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_430px]">
          <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
            <CameraTracker autoStart mirror={mirror} overlay={overlay} onSnapshot={setSnapshot} />
          </section>

          <section className="flex min-h-[360px] flex-col rounded-lg border border-line bg-white p-6 shadow-soft">
            <PredictionPanel predictedSign={predictedSign} recognition={recognition} requiredStableFrames={requiredStableFrames} />
            <QualityIndicators insideGuideFrame={insideGuideFrame} steady={steady} handDetected={Boolean(snapshot)} />
            <TopPredictions predictions={recognition.topPredictions} />
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
          <PracticeSignGrid
            signs={practiceSigns}
            selectedLabel={selectedSign.label}
            active={practiceCameraOpen}
            onSelect={(label) => {
              setSelectedLabel(label);
              setPracticeCameraOpen(true);
            }}
          />

          {practiceCameraOpen ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
                <CameraTracker autoStart mirror={mirror} overlay={overlay} onSnapshot={setSnapshot} />
              </section>
              <PracticeVerdictPanel
                displayName={selectedSign.displayName}
                hasVerdict={practiceHasVerdict}
                isCorrect={practiceIsCorrect}
              />
            </div>
          ) : null}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
        <CaptureCameraPanel
          mirror={mirror}
          overlay={overlay}
          predictedSign={predictedSign}
          onMirrorChange={() => setMirror((value) => !value)}
          onOverlayChange={() => setOverlay((value) => !value)}
          onSnapshot={setSnapshot}
        />

        <aside className="space-y-5">
          <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <CapturePredictionPanel
              recognition={recognition}
              requiredStableFrames={requiredStableFrames}
              modelMessage={isDynamicSign ? dynamicModelMessage : modelMessage}
              correctionTip={quality?.reasons[0] ?? (recognition.state === "no_model" ? (isDynamicSign ? dynamicModelMessage : modelMessage) : selectedSign.commonMistakes)}
            />
            <CaptureFeedbackPanel message={feedbackMessage} onFeedback={handleFeedback} />
          </section>

          <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Capture sample</h2>
            <WordSignForm value={wordInput} message={wordMessage} onChange={setWordInput} onSubmit={handleAddWordSign} />
            <SignLabelSelect signs={availableSigns} selectedLabel={selectedLabel} onChange={setSelectedLabel} />
            <div className="mt-4 grid gap-2">
              {isDynamicSign ? (
                <DynamicRecordingPanel
                  frameCount={dynamicRecording.length}
                  onStart={() => {
                    startDynamicRecording();
                    setSaveMessage("Recording dynamic sign...");
                  }}
                  onStop={() => {
                    stopDynamicRecording();
                    setSaveMessage(`Recording stopped with ${dynamicRecording.length} frame(s).`);
                  }}
                />
              ) : null}
              <SampleSavePanel dynamic={isDynamicSign} message={saveMessage} onSave={handleSaveSample} />
            </div>
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
