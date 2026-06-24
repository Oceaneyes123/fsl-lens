"use client";

import { CaptureWorkspace } from "@/components/capture/capture-workspace";
import { PracticeWorkspace } from "@/components/practice/practice-workspace";
import { RecognitionWorkspace } from "@/components/recognition/recognition-workspace";

export type CameraWorkspaceProps = { mode: "recognize" | "capture" | "practice" };

export function CameraWorkspace({ mode }: CameraWorkspaceProps) {
  if (mode === "recognize") return <RecognitionWorkspace />;
  if (mode === "practice") return <PracticeWorkspace />;
  return <CaptureWorkspace />;
}
