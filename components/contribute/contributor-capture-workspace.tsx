"use client";

import { useCallback, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CameraTracker } from "@/components/camera-tracker";
import { useDynamicRecording } from "@/hooks/use-dynamic-recording";
import { useGuideQuality } from "@/hooks/use-guide-quality";
import { useSampleCapture } from "@/hooks/use-sample-capture";
import { buildContributorSamplePayload } from "@/lib/dataset/contributor-sample";
import { defaultContributorMetadata, type ContributorMetadata } from "@/lib/dataset/contributor-metadata";
import { buildDynamicSamplePayload } from "@/lib/dataset/dynamic-sample";
import { buildStaticSamplePayload } from "@/lib/dataset/static-sample";
import type { LandmarkSnapshot } from "@/lib/detection/landmark-snapshot";
import { signs } from "@/lib/signs";
import { ContributorCapturePanel } from "./contributor-capture-panel";
import { ContributorConsentCard } from "./contributor-consent-card";
import { ContributorMetadataForm } from "./contributor-metadata-form";
import { ContributorSignList } from "./contributor-sign-list";

const snapshotIntervalMs = 1000 / 15;

export function ContributorCaptureWorkspace() {
  const [consent, setConsent] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(signs[0].label);
  const [metadata, setMetadata] = useState<ContributorMetadata>(defaultContributorMetadata);
  const [snapshot, setSnapshot] = useState<LandmarkSnapshot | null>(null);
  const [attempts, setAttempts] = useState(0);
  const lastSnapshotAt = useRef(0);
  const selectedSign = signs.find((sign) => sign.label === selectedLabel) ?? signs[0];
  const dynamic = selectedSign.modality === "dynamic";
  const recorder = useDynamicRecording();
  const { addFrame } = recorder;
  const quality = useGuideQuality({ snapshot, selectedSign, isDynamicSign: dynamic });
  const capture = useSampleCapture();

  const handleSnapshot = useCallback((next: LandmarkSnapshot | null) => {
    if (!next) {
      if (lastSnapshotAt.current === 0) return;
      lastSnapshotAt.current = 0;
      setSnapshot(null);
      return;
    }
    const now = performance.now();
    if (now - lastSnapshotAt.current < snapshotIntervalMs) return;
    lastSnapshotAt.current = now;
    setSnapshot(next);
    addFrame(next.landmarks, next.confidence);
  }, [addFrame]);

  async function submit() {
    if (!snapshot || !consent) return;
    const common = { sign: selectedSign, snapshot, qualityStatus: quality.quality?.status ?? "rejected", sessionId: window.crypto.randomUUID() };
    if (dynamic) {
      if (recorder.recording.length < 2) { capture.setSaveMessage("Record the full movement before submitting."); return; }
      const contribution = buildContributorSamplePayload({ sample: buildDynamicSamplePayload({ ...common, recording: recorder.summarize() }), consent, metadata });
      const result = await capture.saveDynamic(contribution.sample);
      if (result.ok) { setAttempts((count) => count + 1); recorder.reset(); }
    } else {
      const contribution = buildContributorSamplePayload({ sample: buildStaticSamplePayload(common), consent, metadata });
      const result = await capture.saveStatic(contribution.sample);
      if (result.ok) setAttempts((count) => count + 1);
    }
  }

  return (
    <AppShell>
      <div className="mb-5"><h1 className="text-2xl font-semibold text-ink">Contribute FSL samples</h1><p className="mt-1 text-slate-600">Help improve signer diversity with isolated, landmark-only samples.</p></div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
        <section className="rounded-lg border border-line bg-white p-4 shadow-soft"><CameraTracker autoStart mirror overlay onSnapshot={handleSnapshot} /></section>
        <aside className="space-y-5">
          <ContributorConsentCard consent={consent} onChange={setConsent} />
          <section className="space-y-4 rounded-lg border border-line bg-white p-5 shadow-soft"><ContributorSignList signs={signs} selected={selectedLabel} onSelect={(label) => { setSelectedLabel(label); setAttempts(0); recorder.reset(); }} /><ContributorMetadataForm value={metadata} onChange={setMetadata} /></section>
          <ContributorCapturePanel dynamic={dynamic} recording={recorder.isRecording} frameCount={recorder.recording.length} attempts={attempts} disabled={!consent || !snapshot || quality.quality?.status === "rejected"} message={capture.saveMessage} onStart={recorder.start} onStop={recorder.stop} onSubmit={() => void submit()} />
        </aside>
      </div>
    </AppShell>
  );
}

