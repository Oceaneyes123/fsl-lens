import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = process.env;

async function loadHasSupabaseConfig(env: NodeJS.ProcessEnv) {
  vi.resetModules();
  process.env = { ...originalEnv, ...env };
  const module = await import("./supabase");
  return module.hasSupabaseConfig;
}

describe("Supabase config", () => {
  afterEach(() => {
    process.env = originalEnv;
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
