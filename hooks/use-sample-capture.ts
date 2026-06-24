"use client";

import { useState } from "react";
import { saveDynamicLandmarkSample, saveLandmarkSample } from "@/lib/storage/supabase";

export function useSampleCapture() {
  const [saveMessage, setSaveMessage] = useState("");
  async function saveStatic(sample: Parameters<typeof saveLandmarkSample>[0]) {
    const result = await saveLandmarkSample(sample);
    setSaveMessage(result.ok ? "Landmark sample saved to Supabase." : result.message);
    return result;
  }
  async function saveDynamic(sample: Parameters<typeof saveDynamicLandmarkSample>[0]) {
    const result = await saveDynamicLandmarkSample(sample);
    setSaveMessage(result.ok ? "Dynamic landmark sequence saved to Supabase." : result.message);
    return result;
  }
  return { saveMessage, setSaveMessage, saveStatic, saveDynamic };
}
