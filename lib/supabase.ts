import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeedbackInsert } from "./feedback";
import type { KnnModel } from "./recognition";
import { signs } from "./signs";

type SampleInsert = {
  sign_id: string;
  session_id: string;
  landmarks_json: unknown;
  hand_count: number;
  handedness: string[];
  detector_confidence: number;
  camera_type: string;
  lighting_note: string;
  quality_status: string;
  review_status: string;
  consent_raw_image: boolean;
  raw_image_url: string | null;
};

export type AdminSampleRow = {
  id: string;
  sign_id: string;
  session_id: string;
  hand_count: number;
  detector_confidence: number;
  quality_status: string;
  review_status: string;
  created_at: string;
};

export type AdminFeedbackRow = {
  id: string;
  session_id: string;
  predicted_sign_id: string | null;
  expected_sign_id: string | null;
  confidence: number | null;
  was_correct: boolean | null;
  created_at: string;
};

export type AdminModelVersionRow = {
  id: string;
  version_name: string;
  dataset_version_id: string | null;
  model_type: string;
  model_file_url: string | null;
  accuracy: number | null;
  status: string;
  created_at: string;
};

export type AdminDatasetVersionRow = {
  id: string;
  version_name: string;
  sample_count: number;
  created_at: string;
};

export type AdminData = {
  samples: AdminSampleRow[];
  feedback: AdminFeedbackRow[];
  modelVersions: AdminModelVersionRow[];
  datasetVersions: AdminDatasetVersionRow[];
  stats: AdminStats;
};

export type AdminCount = {
  label: string;
  count: number;
};

export type AdminStats = {
  sampleTotal: number;
  feedbackTotal: number;
  modelVersionTotal: number;
  datasetVersionTotal: number;
  qualityCounts: AdminCount[];
  reviewCounts: AdminCount[];
  feedbackCounts: AdminCount[];
  modelStatusCounts: AdminCount[];
  topSignCounts: AdminCount[];
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
let supabaseClient: SupabaseClient | null = null;

export function hasSupabaseConfig() {
  return (
    supabaseUrl.startsWith("http") &&
    supabaseKey.length > 20 &&
    !supabaseUrl.includes("REQUIRES_") &&
    !supabaseKey.includes("REQUIRES_")
  );
}

function createSupabaseClient() {
  supabaseClient ??= createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
}

export async function saveLandmarkSample(sample: SampleInsert): Promise<{ ok: boolean; message: string; sampleId: string | null }> {
  if (!hasSupabaseConfig()) {
    return {
      ok: false,
      message:
        "Supabase save requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.",
      sampleId: null,
    };
  }

  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from("samples").insert(sample).select("id").single();

  if (error) {
    return { ok: false, message: error.message, sampleId: null };
  }

  return { ok: true, message: "Sample saved.", sampleId: data?.id ?? null };
}

export async function saveFeedback(feedback: FeedbackInsert): Promise<{ ok: boolean; message: string }> {
  if (!hasSupabaseConfig()) {
    return {
      ok: false,
      message:
        "Supabase feedback requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.",
    };
  }

  const supabase = createSupabaseClient();
  const { error } = await supabase.from("feedback").insert(feedback);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Feedback saved." };
}

export async function deleteSample(sampleId: string): Promise<{ ok: boolean; message: string }> {
  if (!hasSupabaseConfig()) {
    return {
      ok: false,
      message:
        "Sample deletion requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.",
    };
  }

  const supabase = createSupabaseClient();
  const { error } = await supabase.from("samples").delete().eq("id", sampleId);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Sample deleted." };
}

export async function loadRecognitionModel(): Promise<{ model: KnnModel | null; message: string }> {
  if (hasSupabaseConfig()) {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("model_versions")
      .select("model_file_url")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return loadFallbackModel(`Unable to load active model metadata: ${error.message}`);
    }

    if (data?.model_file_url) {
      return fetchModelJson(data.model_file_url, "Loaded active Supabase model.");
    }
  }

  return loadFallbackModel("No active Supabase model is configured.");
}

export async function loadAdminData({
  signId,
  qualityStatus,
  reviewStatus,
}: {
  signId?: string;
  qualityStatus?: string;
  reviewStatus?: string;
} = {}): Promise<{ ok: boolean; data: AdminData | null; message: string }> {
  if (!hasSupabaseConfig()) {
    return {
      ok: false,
      data: null,
      message:
        "Admin data requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.",
    };
  }

  const supabase = createSupabaseClient();
  let samplesQuery = supabase
    .from("samples")
    .select("id, sign_id, session_id, hand_count, detector_confidence, quality_status, review_status, created_at")
    .order("created_at", { ascending: false })
    .limit(25);

  if (signId) {
    samplesQuery = samplesQuery.eq("sign_id", signId);
  }

  if (qualityStatus) {
    samplesQuery = samplesQuery.eq("quality_status", qualityStatus);
  }

  if (reviewStatus) {
    samplesQuery = samplesQuery.eq("review_status", reviewStatus);
  }

  const sampleCountQuery = (quality?: string, review?: string, sign?: string) => {
    let query = supabase.from("samples").select("*", { count: "exact", head: true });

    if (sign) {
      query = query.eq("sign_id", sign);
    }

    if (quality) {
      query = query.eq("quality_status", quality);
    }

    if (review) {
      query = query.eq("review_status", review);
    }

    return query;
  };
  const feedbackCountQuery = (wasCorrect?: boolean | null) => {
    let query = supabase.from("feedback").select("*", { count: "exact", head: true });

    if (wasCorrect === null) {
      query = query.is("was_correct", null);
    }

    if (typeof wasCorrect === "boolean") {
      query = query.eq("was_correct", wasCorrect);
    }

    return query;
  };
  const modelStatusCountQuery = (status?: string) => {
    let query = supabase.from("model_versions").select("*", { count: "exact", head: true });

    if (status) {
      query = query.eq("status", status);
    }

    return query;
  };

  const qualityOptions = ["clean", "low_quality", "rejected"];
  const reviewOptions = ["pending", "approved", "rejected"];
  const modelStatusOptions = ["draft", "testing", "active", "archived"];
  const topSignQueries = signs.map((sign) => sampleCountQuery(qualityStatus, reviewStatus, sign.label));

  const [
    samples,
    feedback,
    modelVersions,
    datasetVersions,
    sampleTotal,
    feedbackTotal,
    modelVersionTotal,
    datasetVersionTotal,
    ...statResults
  ] = await Promise.all([
    samplesQuery,
    supabase
      .from("feedback")
      .select("id, session_id, predicted_sign_id, expected_sign_id, confidence, was_correct, created_at")
      .order("created_at", { ascending: false })
      .limit(25),
    supabase
      .from("model_versions")
      .select("id, version_name, dataset_version_id, model_type, model_file_url, accuracy, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("dataset_versions").select("id, version_name, sample_count, created_at").order("created_at", {
      ascending: false,
    }),
    sampleCountQuery(qualityStatus, reviewStatus, signId),
    feedbackCountQuery(),
    modelStatusCountQuery(),
    supabase.from("dataset_versions").select("*", { count: "exact", head: true }),
    ...qualityOptions.map((option) => sampleCountQuery(option, reviewStatus, signId)),
    ...reviewOptions.map((option) => sampleCountQuery(qualityStatus, option, signId)),
    feedbackCountQuery(true),
    feedbackCountQuery(false),
    feedbackCountQuery(null),
    ...modelStatusOptions.map((option) => modelStatusCountQuery(option)),
    ...topSignQueries,
  ]);

  const statError = [
    sampleTotal,
    feedbackTotal,
    modelVersionTotal,
    datasetVersionTotal,
    ...statResults,
  ].find((result) => result.error)?.error;
  const firstError = samples.error ?? feedback.error ?? modelVersions.error ?? datasetVersions.error ?? statError;
  if (firstError) {
    return { ok: false, data: null, message: firstError.message };
  }

  const qualityResults = statResults.slice(0, qualityOptions.length);
  const reviewResults = statResults.slice(qualityOptions.length, qualityOptions.length + reviewOptions.length);
  const feedbackResults = statResults.slice(
    qualityOptions.length + reviewOptions.length,
    qualityOptions.length + reviewOptions.length + 3
  );
  const modelStatusResults = statResults.slice(
    qualityOptions.length + reviewOptions.length + 3,
    qualityOptions.length + reviewOptions.length + 3 + modelStatusOptions.length
  );
  const signResults = statResults.slice(qualityOptions.length + reviewOptions.length + 3 + modelStatusOptions.length);

  return {
    ok: true,
    data: {
      samples: samples.data ?? [],
      feedback: feedback.data ?? [],
      modelVersions: modelVersions.data ?? [],
      datasetVersions: datasetVersions.data ?? [],
      stats: {
        sampleTotal: sampleTotal.count ?? 0,
        feedbackTotal: feedbackTotal.count ?? 0,
        modelVersionTotal: modelVersionTotal.count ?? 0,
        datasetVersionTotal: datasetVersionTotal.count ?? 0,
        qualityCounts: qualityOptions.map((label, index) => ({ label, count: qualityResults[index]?.count ?? 0 })),
        reviewCounts: reviewOptions.map((label, index) => ({ label, count: reviewResults[index]?.count ?? 0 })),
        feedbackCounts: ["correct", "wrong", "unmarked"].map((label, index) => ({
          label,
          count: feedbackResults[index]?.count ?? 0,
        })),
        modelStatusCounts: modelStatusOptions.map((label, index) => ({
          label,
          count: modelStatusResults[index]?.count ?? 0,
        })),
        topSignCounts: signs
          .map((sign, index) => ({
            label: sign.displayName,
            count: signResults[index]?.count ?? 0,
          }))
          .filter((item) => item.count > 0)
          .sort((a, b) => b.count - a.count)
          .slice(0, 8),
      },
    },
    message: "Admin data loaded.",
  };
}

async function loadFallbackModel(reason: string) {
  return fetchModelJson("/models/active-knn-model.json", `${reason} Loaded fallback model.`).catch(() => ({
    model: null,
    message: `${reason} No fallback model was found at /models/active-knn-model.json.`,
  }));
}

async function fetchModelJson(url: string, message: string): Promise<{ model: KnnModel | null; message: string }> {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Model request failed with ${response.status}.`);
  }

  return { model: (await response.json()) as KnnModel, message };
}
