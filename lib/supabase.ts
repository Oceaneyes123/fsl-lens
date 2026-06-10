import { createClient } from "@supabase/supabase-js";

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function hasSupabaseConfig() {
  return (
    supabaseUrl.startsWith("http") &&
    supabaseAnonKey.length > 20 &&
    !supabaseUrl.includes("REQUIRES_") &&
    !supabaseAnonKey.includes("REQUIRES_")
  );
}

export async function saveLandmarkSample(sample: SampleInsert): Promise<{ ok: boolean; message: string }> {
  if (!hasSupabaseConfig()) {
    return {
      ok: false,
      message: "Supabase save requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { error } = await supabase.from("samples").insert(sample);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Sample saved." };
}
