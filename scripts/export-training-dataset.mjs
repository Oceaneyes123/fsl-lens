import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

function parseArgs(argv) {
  const args = { out: "ml/datasets/export.jsonl", status: "approved", dryRun: false };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--out") args.out = argv[++index];
    else if (argv[index] === "--status") args.status = argv[++index];
    else if (argv[index] === "--dry-run") args.dryRun = true;
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  return args;
}

function normalize(row, modality) {
  const frames = modality === "dynamic" ? (row.frames_json ?? []) : undefined;
  return {
    sample_id: row.id,
    sign_id: row.sign_id,
    sign_label: row.sign_label ?? row.sign_id,
    modality,
    landmark_schema_version: row.landmark_schema_version ?? "hand_v1",
    feature_version: row.feature_version ?? "hand_v1",
    ...(frames ? { frames } : {}),
    ...(modality === "static" ? { landmarks: row.landmarks_json ?? [] } : {}),
    hand_count: row.hand_count,
    handedness: row.handedness ?? [],
    frame_count: row.frame_count ?? (frames?.length ?? 1),
    fps: row.fps ?? null,
    review_status: row.review_status,
    contributor_id: row.signer_id ?? row.contributor_id ?? null,
    contributor: row.contributor ?? null,
  };
}

export async function exportDataset({ client, status }) {
  const [staticResult, dynamicResult] = await Promise.all([
    client.from("samples").select("*").eq("review_status", status),
    client.from("dynamic_samples").select("*").eq("review_status", status),
  ]);
  const error = staticResult.error ?? dynamicResult.error;
  if (error) throw error;
  return [
    ...(staticResult.data ?? []).map((row) => normalize(row, "static")),
    ...(dynamicResult.data ?? []).map((row) => normalize(row, "dynamic")),
  ];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or existing public Supabase variables).");
  const samples = await exportDataset({ client: createClient(url, key), status: args.status });
  if (args.dryRun) { console.log(`Dry run: ${samples.length} ${args.status} sample(s) would be exported.`); return; }
  const output = resolve(args.out);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, samples.map((sample) => JSON.stringify(sample)).join("\n") + (samples.length ? "\n" : ""), "utf8");
  console.log(`Exported ${samples.length} sample(s) to ${output}.`);
}

if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replaceAll("\\", "/")}`).href) main().catch((error) => { console.error(error.message); process.exitCode = 1; });

