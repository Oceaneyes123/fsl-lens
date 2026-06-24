import type { DynamicSample } from "./dynamic-sample";
import type { StaticSample } from "./static-sample";
import { defaultContributorMetadata, type ContributorMetadata } from "./contributor-metadata";

export function buildContributorSamplePayload<T extends StaticSample | DynamicSample>({ sample, consent, metadata = defaultContributorMetadata }: {
  sample: T;
  consent: boolean;
  metadata?: ContributorMetadata;
}) {
  if (!consent) throw new Error("Consent is required before submitting a contributor sample.");
  const privacySafeSample = { ...sample, review_status: "pending", consent_raw_image: false, raw_image_url: null } as T;
  return {
    modality: "frames_json" in sample ? "dynamic" as const : "static" as const,
    sample: privacySafeSample,
    contributor: { ...metadata },
  };
}
