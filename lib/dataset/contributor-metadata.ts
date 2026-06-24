export type ContributorMetadata = {
  dominant_hand: "left" | "right" | "ambidextrous" | "prefer_not_to_say";
  experience_level: "beginner" | "intermediate" | "fluent" | "prefer_not_to_say";
  device_type: "mobile" | "desktop" | "tablet" | "unknown";
  camera_facing: "front" | "back" | "webcam" | "unknown";
  lighting_quality: "good" | "medium" | "poor" | "unknown";
};

export const defaultContributorMetadata: ContributorMetadata = {
  dominant_hand: "prefer_not_to_say",
  experience_level: "prefer_not_to_say",
  device_type: "unknown",
  camera_facing: "unknown",
  lighting_quality: "unknown",
};

