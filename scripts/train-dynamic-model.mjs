import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { readEnvFile } from "./train-knn-model.mjs";

const defaultModelPath = path.join("public", "models", "active-dynamic-model.json");
const defaultReportPath = path.join("output", "dynamic-training-report.json");
const defaultEnvPath = ".env.local";
const defaultTargetFrameCount = 30;

export function normalizeDynamicSequence(frames, { targetFrameCount = defaultTargetFrameCount } = {}) {
  const resampledFrames = resampleLandmarkFrames(frames, targetFrameCount);

  if (resampledFrames.length === 0) {
    return [];
  }

  return resampledFrames.flatMap((frame, frameIndex) => {
    const normalized = normalizeLandmarks(frame);
    const previousFrame = frameIndex === 0 ? null : resampledFrames[frameIndex - 1];
    const deltas = previousFrame ? calculateFrameDeltas(previousFrame, frame) : Array(normalized.length).fill(0);
    return [...normalized, ...deltas];
  });
}

export function predictNearestSequence(samples, target, excludeId = null) {
  return (
    samples
      .filter(
        (sample) =>
          sample.id !== excludeId && sample.handCount === target.handCount && sample.vector.length === target.vector.length,
      )
      .map((sample) => ({ label: sample.signLabel, distance: distance(sample.vector, target.vector) }))
      .sort((a, b) => a.distance - b.distance)[0] ?? null
  );
}

export function createUsableDynamicSamples(rows, { targetFrameCount = defaultTargetFrameCount } = {}) {
  return rows
    .filter((row) => row.quality_status === "clean")
    .filter((row) => Array.isArray(row.frames_json) && row.frames_json.length === row.frame_count)
    .map((row) => ({
      id: row.id,
      signLabel: row.sign_id,
      handCount: row.hand_count,
      frameCount: row.frame_count,
      fps: Number(row.fps),
      vector: normalizeDynamicSequence(row.frames_json, { targetFrameCount }),
      qualityStatus: row.quality_status,
      reviewStatus: row.review_status,
      detectorConfidence: Number(row.detector_confidence),
    }))
    .filter((sample) => sample.vector.length === targetFrameCount * sample.handCount * 21 * 3 * 2);
}

export async function trainDynamicModel({
  envPath = defaultEnvPath,
  modelPath = defaultModelPath,
  reportPath = defaultReportPath,
  targetFrameCount = defaultTargetFrameCount,
} = {}) {
  const env = readEnvFile(envPath);
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(`Missing Supabase URL/key in ${envPath}.`);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from("dynamic_samples")
    .select("id, sign_id, hand_count, frames_json, frame_count, fps, quality_status, review_status, detector_confidence")
    .eq("quality_status", "clean")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const usableSamples = createUsableDynamicSamples(data ?? [], { targetFrameCount });

  if (usableSamples.length === 0) {
    throw new Error("No usable clean dynamic samples found.");
  }

  const { train, test } = stratifiedSplit(usableSamples);
  const report = createTrainingReport({ samples: usableSamples, train, test, modelPath });
  const model = createModel(usableSamples, { targetFrameCount });

  writeJson(modelPath, model);
  writeJson(reportPath, report);

  return { model, report };
}

function normalizeLandmarks(hands) {
  return hands.flatMap((hand) => normalizeHand(hand));
}

function normalizeHand(hand) {
  const wrist = hand[0] ?? { x: 0, y: 0, z: 0 };
  const scale = Math.max(
    ...hand.map((point) => Math.hypot(point.x - wrist.x, point.y - wrist.y, (point.z ?? 0) - (wrist.z ?? 0))),
    0.0001,
  );

  return hand.flatMap((point) => [
    roundFeature((point.x - wrist.x) / scale),
    roundFeature((point.y - wrist.y) / scale),
    roundFeature(((point.z ?? 0) - (wrist.z ?? 0)) / scale),
  ]);
}

function resampleLandmarkFrames(frames, targetFrameCount) {
  if (frames.length === 0 || targetFrameCount <= 0) {
    return [];
  }

  if (targetFrameCount === 1) {
    return [frames[0]];
  }

  return Array.from({ length: targetFrameCount }, (_, index) => {
    const sourceIndex = Math.round((index * (frames.length - 1)) / (targetFrameCount - 1));
    return frames[sourceIndex];
  });
}

function calculateFrameDeltas(previousFrame, frame) {
  return frame.flatMap((hand, handIndex) =>
    hand.flatMap((point, pointIndex) => {
      const previousPoint = previousFrame[handIndex]?.[pointIndex] ?? point;
      return [
        roundFeature(point.x - previousPoint.x),
        roundFeature(point.y - previousPoint.y),
        roundFeature((point.z ?? 0) - (previousPoint.z ?? 0)),
      ];
    }),
  );
}

function distance(left, right) {
  let sum = 0;

  for (let index = 0; index < left.length; index += 1) {
    const delta = left[index] - right[index];
    sum += delta * delta;
  }

  return Math.sqrt(sum / left.length);
}

function createModel(samples, { targetFrameCount }) {
  return {
    versionName: `local-dynamic-knn-${new Date().toISOString().slice(0, 10)}`,
    modelType: "dynamic_sequence_knn",
    thresholdConfig: {
      confirmThreshold: 0.8,
      uncertainThreshold: 0.6,
      requiredStableSequences: 2,
    },
    sequenceConfig: {
      targetFrameCount,
    },
    samples: samples.map(({ signLabel, handCount, vector, qualityStatus }) => ({
      signLabel,
      handCount,
      vector,
      qualityStatus,
    })),
  };
}

function createTrainingReport({ samples, train, test, modelPath }) {
  let leaveOneOutCorrect = 0;
  const confusion = {};

  for (const sample of samples) {
    const result = predictNearestSequence(samples, sample, sample.id);
    const predicted = result?.label ?? "none";

    confusion[sample.signLabel] ??= {};
    confusion[sample.signLabel][predicted] = (confusion[sample.signLabel][predicted] ?? 0) + 1;

    if (predicted === sample.signLabel) {
      leaveOneOutCorrect += 1;
    }
  }

  let splitCorrect = 0;

  for (const sample of test) {
    const result = predictNearestSequence(train, sample);

    if (result?.label === sample.signLabel) {
      splitCorrect += 1;
    }
  }

  const countsByLabel = samples.reduce((counts, sample) => {
    counts[sample.signLabel] = (counts[sample.signLabel] ?? 0) + 1;
    return counts;
  }, {});

  return {
    generatedAt: new Date().toISOString(),
    source: "Supabase dynamic_samples table via .env.local public key",
    modelFile: modelPath.replaceAll("\\", "/"),
    dataset: {
      usableSampleCount: samples.length,
      countsByLabel,
      approvedCount: samples.filter((sample) => sample.reviewStatus === "approved").length,
      pendingCount: samples.filter((sample) => sample.reviewStatus === "pending").length,
      labelsCovered: Object.keys(countsByLabel).sort(),
    },
    validation: {
      method: "1-nearest-neighbor over normalized landmark sequences with frame deltas",
      leaveOneOut: {
        correct: leaveOneOutCorrect,
        total: samples.length,
        accuracy: roundFeature(leaveOneOutCorrect / samples.length),
      },
      deterministicStratifiedHoldout: {
        trainCount: train.length,
        testCount: test.length,
        correct: splitCorrect,
        accuracy: test.length > 0 ? roundFeature(splitCorrect / test.length) : 0,
      },
      confusion,
      caveats: [
        "This baseline is browser-exportable and should be replaced by LSTM/GRU or Temporal CNN after enough signer-diverse clips exist.",
        "No signer-based split is possible without signer metadata.",
      ],
    },
  };
}

function stratifiedSplit(samples) {
  const byLabel = new Map();

  for (const sample of samples) {
    if (!byLabel.has(sample.signLabel)) {
      byLabel.set(sample.signLabel, []);
    }

    byLabel.get(sample.signLabel).push(sample);
  }

  const train = [];
  const test = [];

  for (const labelSamples of byLabel.values()) {
    labelSamples.sort((left, right) => left.id.localeCompare(right.id));
    const testCount = Math.max(1, Math.round(labelSamples.length * 0.25));
    test.push(...labelSamples.slice(0, testCount));
    train.push(...labelSamples.slice(testCount));
  }

  return { train, test };
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function roundFeature(value) {
  return Math.round(value * 1000000) / 1000000;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  trainDynamicModel()
    .then(({ report }) => {
      console.log(JSON.stringify(report, null, 2));
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
