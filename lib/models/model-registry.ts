import type { ModelManifest } from "./model-manifest";

export function selectActiveModelManifest(manifests: ModelManifest[], modelType: ModelManifest["modelType"]) {
  return manifests.find((manifest) => manifest.modelType === modelType && manifest.status === "active") ?? null;
}

export function validateModelManifest(manifest: ModelManifest) {
  const errors: string[] = [];
  if (!manifest.modelId.trim()) errors.push("modelId is required");
  if (!manifest.versionName.trim()) errors.push("versionName is required");
  if (manifest.supportedSigns.length === 0) errors.push("supportedSigns must not be empty");
  if (manifest.runtime !== "knn" && manifest.modelType.endsWith("knn")) errors.push("KNN models require the knn runtime");
  return { valid: errors.length === 0, errors };
}

