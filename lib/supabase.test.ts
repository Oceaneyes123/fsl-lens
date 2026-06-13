import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = process.env;
const updateMock = vi.fn();
const eqMock = vi.fn();
const neqMock = vi.fn();
const insertMock = vi.fn();
const selectMock = vi.fn();
const singleMock = vi.fn();
const fromMock = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: fromMock,
  })),
}));

async function loadHasSupabaseConfig(env: NodeJS.ProcessEnv) {
  vi.resetModules();
  process.env = { ...originalEnv, ...env };
  const module = await import("./supabase");
  return module.hasSupabaseConfig;
}

describe("Supabase config", () => {
  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("accepts a publishable key from env.local", async () => {
    const hasSupabaseConfig = await loadHasSupabaseConfig({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_12345678901234567890",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
    });

    expect(hasSupabaseConfig()).toBe(true);
  });

  it("falls back to the legacy anon key", async () => {
    const hasSupabaseConfig = await loadHasSupabaseConfig({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: undefined,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    });

    expect(hasSupabaseConfig()).toBe(true);
  });
});

describe("sample review updates", () => {
  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("updates a sample review status by id", async () => {
    eqMock.mockResolvedValue({ error: null });
    updateMock.mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ update: updateMock });

    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_12345678901234567890",
    };
    const { updateSampleReviewStatus } = await import("./supabase");

    const result = await updateSampleReviewStatus("sample-1", "approved");

    expect(fromMock).toHaveBeenCalledWith("samples");
    expect(updateMock).toHaveBeenCalledWith({ review_status: "approved" });
    expect(eqMock).toHaveBeenCalledWith("id", "sample-1");
    expect(result).toEqual({ ok: true, message: "Sample approved." });
  });

  it("updates matching sample review statuses in bulk", async () => {
    const query = {
      eq: vi.fn(),
    };
    query.eq.mockReturnValue(query);
    updateMock.mockReturnValue(query);
    fromMock.mockReturnValue({ update: updateMock });

    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_12345678901234567890",
    };
    const { updateSampleReviewStatuses } = await import("./supabase");

    const result = await updateSampleReviewStatuses({
      reviewStatus: "approved",
      signId: "alphabet_A",
      qualityStatus: "clean",
      currentReviewStatus: "pending",
    });

    expect(fromMock).toHaveBeenCalledWith("samples");
    expect(updateMock).toHaveBeenCalledWith({ review_status: "approved" });
    expect(query.eq).toHaveBeenCalledWith("sign_id", "alphabet_A");
    expect(query.eq).toHaveBeenCalledWith("quality_status", "clean");
    expect(query.eq).toHaveBeenCalledWith("review_status", "pending");
    expect(result).toEqual({ ok: true, message: "Matching samples approved." });
  });
});

describe("dynamic landmark samples", () => {
  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("saves dynamic landmark sequences separately from static samples", async () => {
    singleMock.mockResolvedValue({ data: { id: "dynamic-sample-1" }, error: null });
    selectMock.mockReturnValue({ single: singleMock });
    insertMock.mockReturnValue({ select: selectMock });
    fromMock.mockReturnValue({ insert: insertMock });

    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_12345678901234567890",
    };
    const { saveDynamicLandmarkSample } = await import("./supabase");

    const sample = {
      sign_id: "alphabet_J",
      session_id: "session-1",
      frames_json: [
        [
          [
            { x: 0, y: 0, z: 0 },
            { x: 0.1, y: 0.1, z: 0 },
          ],
        ],
      ],
      frame_count: 1,
      fps: 15,
      hand_count: 1,
      handedness: ["Right"],
      detector_confidence: 0.90,
      camera_type: "browser_webcam",
      lighting_note: "not_recorded",
      quality_status: "clean",
      review_status: "pending",
      signer_id: null,
      consent_raw_image: false,
      raw_image_url: null,
    };

    const result = await saveDynamicLandmarkSample(sample);

    expect(fromMock).toHaveBeenCalledWith("dynamic_samples");
    expect(insertMock).toHaveBeenCalledWith(sample);
    expect(result).toEqual({ ok: true, message: "Dynamic sample saved.", sampleId: "dynamic-sample-1" });
  });

  it("updates a dynamic sample review status by id", async () => {
    eqMock.mockResolvedValue({ error: null });
    updateMock.mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ update: updateMock });

    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_12345678901234567890",
    };
    const { updateDynamicSampleReviewStatus } = await import("./supabase");

    const result = await updateDynamicSampleReviewStatus("dynamic-sample-1", "approved");

    expect(fromMock).toHaveBeenCalledWith("dynamic_samples");
    expect(updateMock).toHaveBeenCalledWith({ review_status: "approved" });
    expect(eqMock).toHaveBeenCalledWith("id", "dynamic-sample-1");
    expect(result).toEqual({ ok: true, message: "Dynamic sample approved." });
  });

  it("deletes a dynamic sample by id", async () => {
    eqMock.mockResolvedValue({ error: null });
    fromMock.mockReturnValue({ delete: vi.fn(() => ({ eq: eqMock })) });

    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_12345678901234567890",
    };
    const { deleteDynamicSample } = await import("./supabase");

    const result = await deleteDynamicSample("dynamic-sample-1");

    expect(fromMock).toHaveBeenCalledWith("dynamic_samples");
    expect(eqMock).toHaveBeenCalledWith("id", "dynamic-sample-1");
    expect(result).toEqual({ ok: true, message: "Dynamic sample deleted." });
  });
});

describe("model loading", () => {
  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("excludes dynamic sequence model versions when loading the static recognition model", async () => {
    const query = {
      neq: neqMock,
      eq: eqMock,
      order: vi.fn(),
      limit: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    neqMock.mockReturnValue(query);
    eqMock.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.limit.mockReturnValue(query);
    selectMock.mockReturnValue(query);
    fromMock.mockReturnValue({ select: selectMock });

    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_12345678901234567890",
    };
    const { loadRecognitionModel } = await import("./supabase");

    await loadRecognitionModel();

    expect(fromMock).toHaveBeenCalledWith("model_versions");
    expect(neqMock).toHaveBeenCalledWith("model_type", "dynamic_sequence_knn");
    expect(eqMock).toHaveBeenCalledWith("status", "active");
  });
});
