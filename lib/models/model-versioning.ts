import { featureVersion } from "../features/feature-version";

export function isFeatureVersionCompatible(modelVersion?: number) {
  return modelVersion === undefined || modelVersion === 1 || modelVersion === featureVersion;
}
