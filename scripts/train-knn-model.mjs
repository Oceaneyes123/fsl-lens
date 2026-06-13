import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const defaultModelPath = path.join("public", "models", "active-knn-model.json");
const defaultReportPath = path.join("output", "training-report.json");
const defaultEnvPath = ".env.local";
const sampleColumns = "id, sign_id, hand_count, handedness, landmarks_json, quality_status, review_status, detector_confidence";

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
  return hands.flatMap((hand) => normalizeHand(hand));
}

export function distance(left, right) {
  let sum = 0;

  for (let index = 0; index < left.length; index += 1) {
    const delta = left[index] - right[index];
    sum += delta * delta;
  }

  return Math.sqrt(sum / left.length);
}

export function predictNearest(samples, target, excludeId = null) {
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
    .filter((sample) => sample.vector.length === sample.handCount * 21 * 3);
}

function createModel(samples) {
  return {
    versionName: `local-knn-${new Date().toISOString().slice(0, 10)}`,
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
    const result = predictNearest(samples, sample, sample.id);
    const predicted = result?.label ?? "none";

    confusion[sample.signLabel] ??= {};
    confusion[sample.signLabel][predicted] = (confusion[sample.signLabel][predicted] ?? 0) + 1;

    if (predicted === sample.signLabel) {
      leaveOneOutCorrect += 1;
    }
  }

  let splitCorrect = 0;

  for (const sample of test) {
    const result = predictNearest(train, sample);

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
      method: "1-nearest-neighbor over normalized landmark vectors",
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
