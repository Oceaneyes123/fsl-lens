import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const defaultModelPath = path.join("public", "models", "active-knn-model.json");
const defaultReportPath = path.join("output", "training-report.json");
const defaultEnvPath = ".env.local";
const sampleColumns = "id, sign_id, hand_count, handedness, landmarks_json, quality_status, review_status, detector_confidence";

// Feature sizes — keep in sync with lib/landmarks.ts
const VALUES_PER_LANDMARK = 3;
const FINGER_FEATURE_COUNT = 9;
const LOCATION_FEATURE_COUNT = 3;
const FEATURES_PER_HAND = 21 * VALUES_PER_LANDMARK + FINGER_FEATURE_COUNT + LOCATION_FEATURE_COUNT; // 75
const FEATURE_VERSION = 4;
const K_NEIGHBORS = 3;

// MediaPipe hand landmark indices
const THUMB_CMC = 1, THUMB_MCP = 2, THUMB_IP = 3, THUMB_TIP = 4;
const INDEX_MCP = 5, INDEX_PIP = 6, INDEX_DIP = 7, INDEX_TIP = 8;
const MIDDLE_MCP = 9, MIDDLE_PIP = 10, MIDDLE_DIP = 11, MIDDLE_TIP = 12;
const RING_MCP = 13, RING_PIP = 14, RING_DIP = 15, RING_TIP = 16;
const PINKY_MCP = 17, PINKY_PIP = 18, PINKY_DIP = 19, PINKY_TIP = 20;

const fingerLandmarks = [
  [THUMB_CMC, THUMB_MCP, THUMB_IP, THUMB_TIP],
  [INDEX_MCP, INDEX_PIP, INDEX_DIP, INDEX_TIP],
  [MIDDLE_MCP, MIDDLE_PIP, MIDDLE_DIP, MIDDLE_TIP],
  [RING_MCP, RING_PIP, RING_DIP, RING_TIP],
  [PINKY_MCP, PINKY_PIP, PINKY_DIP, PINKY_TIP],
];

const fingerPairLandmarks = [
  [fingerLandmarks[0], fingerLandmarks[1]], // thumb-index
  [fingerLandmarks[1], fingerLandmarks[2]], // index-middle
  [fingerLandmarks[2], fingerLandmarks[3]], // middle-ring
  [fingerLandmarks[3], fingerLandmarks[4]], // ring-pinky
];

export function readEnvFile(filePath = defaultEnvPath) {
  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1).replace(/^["']|["']$/g, "")];
      }),
  );
}

export function normalizeLandmarks(hands) {
  return orderHands(hands).flatMap((hand) => [...normalizeHand(hand), ...computeFingerFeatures(hand), ...computeLocationFeatures(hand)]);
}

export function orderHands(hands) {
  return hands.length < 2 ? hands : [...hands].sort((left, right) => (left[0]?.x ?? 0) - (right[0]?.x ?? 0));
}

export function distance(left, right) {
  let sum = 0;

  for (let index = 0; index < left.length; index += 1) {
    const delta = left[index] - right[index];
    sum += delta * delta;
  }

  return Math.sqrt(sum / left.length);
}

/**
 * Weighted k-NN prediction: takes top-k nearest neighbors and aggregates by
 * inverse squared distance weighting.
 */
export function predictWeightedKnn(samples, target, { k = K_NEIGHBORS, excludeId = null } = {}) {
  const candidates = samples.filter(
    (sample) =>
      sample.id !== excludeId && sample.handCount === target.handCount && sample.vector.length === target.vector.length,
  );

  if (candidates.length === 0) {
    return null;
  }

  // Compute distances and take top-k
  const distances = candidates.map((sample) => ({
    label: sample.signLabel,
    distance: distance(sample.vector, target.vector),
    id: sample.id,
  }));
  distances.sort((a, b) => a.distance - b.distance);
  const neighbors = distances.slice(0, Math.min(k, distances.length));

  // Aggregate by label using inverse squared distance weighting
  const weightByLabel = new Map();

  for (const { label, distance: dist } of neighbors) {
    const weight = 1 / (1 + dist * dist);
    weightByLabel.set(label, (weightByLabel.get(label) ?? 0) + weight);
  }

  // Pick the label with the highest aggregate weight
  let bestLabel = null;
  let bestWeight = -1;

  for (const [label, weight] of weightByLabel) {
    if (weight > bestWeight) {
      bestWeight = weight;
      bestLabel = label;
    }
  }

  // Use the winning label's nearest distance for threshold confidence.
  const bestDist = distances.find((item) => item.label === bestLabel)?.distance ?? Number.POSITIVE_INFINITY;
  const confidence = Math.max(0, Math.min(1, 1 / (1 + bestDist)));

  return { label: bestLabel, distance: bestDist, confidence };
}

export async function trainKnnModel({
  envPath = defaultEnvPath,
  modelPath = defaultModelPath,
  reportPath = defaultReportPath,
} = {}) {
  const env = readEnvFile(envPath);
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(`Missing Supabase URL/key in ${envPath}.`);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const data = await fetchCleanSamples(supabase);

  const usableSamples = createUsableSamples(data ?? []);

  if (usableSamples.length === 0) {
    throw new Error("No usable clean samples found.");
  }

  const { train, test } = stratifiedSplit(usableSamples);
  const report = createTrainingReport({
    samples: usableSamples,
    train,
    test,
    modelPath,
  });
  const model = createModel(usableSamples);

  writeJson(modelPath, model);
  writeJson(reportPath, report);

  return { model, report };
}

export async function fetchCleanSamples(supabase, { pageSize = 1000 } = {}) {
  const rows = [];

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from("samples")
      .select(sampleColumns)
      .eq("quality_status", "clean")
      .order("created_at", { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    rows.push(...(data ?? []));

    if (!data || data.length < pageSize) {
      return rows;
    }
  }
}

// --- Finger feature computation ---

export function computeFingerFeatures(hand) {
  const features = [];

  // Extension ratios for each finger (tip-to-MCP / sum-of-segments)
  for (const [mcp, pip, dip, tip] of fingerLandmarks) {
    const mcpPos = hand[mcp];
    const pipPos = hand[pip];
    const dipPos = hand[dip];
    const tipPos = hand[tip];

    if (!mcpPos || !pipPos || !dipPos || !tipPos) {
      features.push(0);
      continue;
    }

    const tipToMcp = dist3d(tipPos, mcpPos);
    const segment1 = dist3d(mcpPos, pipPos);
    const segment2 = dist3d(pipPos, dipPos);
    const segment3 = dist3d(dipPos, tipPos);
    const totalSegments = segment1 + segment2 + segment3;

    features.push(totalSegments > 0 ? roundFeature(tipToMcp / totalSegments) : 1);
  }

  // Cosine angles between adjacent finger direction vectors
  for (const [fingerA, fingerB] of fingerPairLandmarks) {
    const aMcp = hand[fingerA[0]];
    const aTip = hand[fingerA[3]];
    const bMcp = hand[fingerB[0]];
    const bTip = hand[fingerB[3]];

    if (!aMcp || !aTip || !bMcp || !bTip) {
      features.push(0);
      continue;
    }

    const dirA = normalize(sub3d(aTip, aMcp));
    const dirB = normalize(sub3d(bTip, bMcp));

    const cosAngle = clamp(dot3d(dirA, dirB), -1, 1);
    features.push(roundFeature(cosAngle));
  }

  return features;
}

export function computeLocationFeatures(hand) {
  const wrist = hand[0] ?? { x: 0, y: 0, z: 0 };
  const scale = Math.max(
    ...hand.map((point) => Math.hypot(point.x - wrist.x, point.y - wrist.y, (point.z ?? 0) - (wrist.z ?? 0))),
    0.0001,
  );
  return [roundFeature(wrist.x), roundFeature(wrist.y), roundFeature(scale)];
}

function dist3d(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
}

function sub3d(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: (a.z ?? 0) - (b.z ?? 0) };
}

function dot3d(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function normalize(v) {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// --- Existing helpers ---

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

function createUsableSamples(rows) {
  return rows
    .filter((row) => Array.isArray(row.landmarks_json) && row.landmarks_json.length === row.hand_count)
    .map((row) => ({
      id: row.id,
      signLabel: row.sign_id,
      handCount: row.hand_count,
      handedness: row.handedness ?? [],
      vector: normalizeLandmarks(row.landmarks_json),
      qualityStatus: row.quality_status,
      reviewStatus: row.review_status,
      detectorConfidence: Number(row.detector_confidence),
    }))
    .filter((sample) => sample.vector.length === sample.handCount * FEATURES_PER_HAND);
}

function createModel(samples) {
  return {
    versionName: `local-knn-${new Date().toISOString().slice(0, 10)}`,
    featureVersion: FEATURE_VERSION,
    modelType: "static_knn",
    thresholdConfig: {
      confirmThreshold: 0.8,
      uncertainThreshold: 0.6,
      requiredStableFrames: 5,
    },
    samples: samples.map(({ signLabel, handCount, handedness, vector, qualityStatus }) => ({
      signLabel,
      handCount,
      handedness,
      vector,
      qualityStatus,
    })),
  };
}

function createTrainingReport({ samples, train, test, modelPath }) {
  let leaveOneOutCorrect = 0;
  const confusion = {};

  for (const sample of samples) {
    const result = predictWeightedKnn(samples, sample, { excludeId: sample.id });
    const predicted = result?.label ?? "none";

    confusion[sample.signLabel] ??= {};
    confusion[sample.signLabel][predicted] = (confusion[sample.signLabel][predicted] ?? 0) + 1;

    if (predicted === sample.signLabel) {
      leaveOneOutCorrect += 1;
    }
  }

  let splitCorrect = 0;

  for (const sample of test) {
    const result = predictWeightedKnn(train, sample);

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
    source: "Supabase samples table via .env.local public key",
    modelFile: modelPath.replaceAll("\\", "/"),
    dataset: {
      usableSampleCount: samples.length,
      countsByLabel,
      approvedCount: samples.filter((sample) => sample.reviewStatus === "approved").length,
      pendingCount: samples.filter((sample) => sample.reviewStatus === "pending").length,
      rejectedExcluded: true,
      labelsCovered: Object.keys(countsByLabel).sort(),
    },
    validation: {
      method: `Weighted k-NN (k=${K_NEIGHBORS}) over normalized landmarks, finger shape, and wrist location`,
      leaveOneOut: {
        correct: leaveOneOutCorrect,
        total: samples.length,
        accuracy: roundFeature(leaveOneOutCorrect / samples.length),
      },
      deterministicStratifiedHoldout: {
        trainCount: train.length,
        testCount: test.length,
        correct: splitCorrect,
        accuracy: roundFeature(splitCorrect / test.length),
      },
      confusion,
      caveats: [
        "This model only covers labels present in the current clean samples.",
        "Pending samples are included because the current dataset has no approved samples.",
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
  trainKnnModel()
    .then(({ report }) => {
      console.log(JSON.stringify(report, null, 2));
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
