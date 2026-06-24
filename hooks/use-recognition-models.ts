"use client";

import { useEffect, useState } from "react";
import { loadDynamicRecognitionModel, loadRecognitionModel } from "@/lib/models/model-loader";
import type { DynamicSequenceModel, KnnModel } from "@/lib/models/model-types";

export function useRecognitionModels() {
  const [state, setState] = useState<{ model: KnnModel | null; dynamicModel: DynamicSequenceModel | null; modelMessage: string; dynamicModelMessage: string }>({ model: null, dynamicModel: null, modelMessage: "Loading recognition model...", dynamicModelMessage: "Loading dynamic recognition model..." });
  useEffect(() => {
    let active = true;
    Promise.all([loadRecognitionModel(), loadDynamicRecognitionModel()]).then(([staticResult, dynamicResult]) => {
      if (active) setState({ model: staticResult.model, dynamicModel: dynamicResult.model, modelMessage: staticResult.message, dynamicModelMessage: dynamicResult.message });
    });
    return () => { active = false; };
  }, []);
  return state;
}
