export type Prediction = {
  label: string;
  confidence: number;
};

export type PredictionState = "confirmed" | "uncertain" | "unknown";

export type PredictionEvaluation = {
  state: PredictionState;
  topPredictions: Prediction[];
  message: string;
};

type PredictionConfig = {
  confirmThreshold?: number;
  uncertainThreshold?: number;
};

export function evaluatePrediction({
  predictions,
  confirmThreshold = 0.8,
  uncertainThreshold = 0.6,
}: {
  predictions: Prediction[];
} & PredictionConfig): PredictionEvaluation {
  const seenLabels = new Set<string>();
  const topPredictions = [...predictions]
    .sort((a, b) => b.confidence - a.confidence)
    .filter((prediction) => {
      if (seenLabels.has(prediction.label)) {
        return false;
      }

      seenLabels.add(prediction.label);
      return true;
    })
    .slice(0, 3);
  const best = topPredictions[0];

  if (!best || best.confidence < uncertainThreshold) {
    return {
      state: "unknown",
      topPredictions,
      message: "Unknown. Hold your hand steady inside the guide frame.",
    };
  }

  if (best.confidence < confirmThreshold) {
    return {
      state: "uncertain",
      topPredictions,
      message: "Uncertain. Check the top suggestions and adjust your hand position.",
    };
  }

  return {
    state: "confirmed",
    topPredictions,
    message: "Prediction confirmed.",
  };
}

export function createPredictionTracker({ requiredFrames = 5 }: { requiredFrames?: number } = {}) {
  let currentLabel: string | null = null;
  let count = 0;

  return {
    update(label: string | null) {
      if (!label) {
        currentLabel = null;
        count = 0;
        return { label: null, count, stable: false };
      }

      if (label === currentLabel) {
        count += 1;
      } else {
        currentLabel = label;
        count = 1;
      }

      return {
        label,
        count,
        stable: count >= requiredFrames,
      };
    },
  };
}
