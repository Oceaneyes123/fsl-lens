import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = process.env;
const updateMock = vi.fn();
const eqMock = vi.fn();
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
