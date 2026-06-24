"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { advanceGuideQuality } from "@/lib/dataset/guide-quality";
import type { GuideQualityState } from "@/lib/dataset/guide-quality";
import type { LandmarkSnapshot } from "@/lib/detection/landmark-snapshot";
import type { SampleQualityResult } from "@/lib/sample-quality";
import type { Sign } from "@/lib/signs";

export { advanceGuideQuality } from "@/lib/dataset/guide-quality";

export function useGuideQuality({ snapshot, selectedSign, isDynamicSign }: {
  snapshot: LandmarkSnapshot | null;
  selectedSign: Sign;
  isDynamicSign: boolean;
}) {
  const history = useRef<ReturnType<typeof advanceGuideQuality>["history"]>([]);
  const [state, setState] = useState<Omit<GuideQualityState, "history" | "quality"> & { quality: SampleQualityResult | null }>({
    insideGuideFrame: false,
    steady: false,
    quality: null,
  });
  const resetQuality = useCallback(() => {
    history.current = [];
    setState({ insideGuideFrame: false, steady: false, quality: null });
  }, []);

  useEffect(() => {
    if (!snapshot) {
      resetQuality();
      return;
    }
    const next = advanceGuideQuality(history.current, snapshot, selectedSign.expectedHandCount, isDynamicSign);
    history.current = next.history;
    setState({ insideGuideFrame: next.insideGuideFrame, steady: next.steady, quality: next.quality });
  }, [isDynamicSign, resetQuality, selectedSign.expectedHandCount, snapshot]);

  return { ...state, resetQuality };
}
