export type SampleQualityStatus = "clean" | "low_quality" | "rejected";
export type SampleQualityInput = { detectedHandCount: number; expectedHandCount: number; detectorConfidence: number; landmarksVisible: boolean; insideGuideFrame: boolean; steady: boolean; requireSteady?: boolean };
export type SampleQualityResult = { status: SampleQualityStatus; reasons: string[] };

export function validateSampleQuality(input: SampleQualityInput): SampleQualityResult {
  const reasons: string[] = [];
  if (input.detectedHandCount !== input.expectedHandCount) return { status: "rejected", reasons: [`Expected ${input.expectedHandCount} hand(s), detected ${input.detectedHandCount}.`] };
  if (!input.landmarksVisible) return { status: "rejected", reasons: ["Required hand landmarks are not visible."] };
  if (input.detectorConfidence < 0.6) return { status: "rejected", reasons: ["Detector confidence is below 60%."] };
  if (input.detectorConfidence < 0.8) reasons.push("Detector confidence is below 80%.");
  if (!input.insideGuideFrame) reasons.push("Hand is outside the ideal camera area.");
  if (input.requireSteady !== false && !input.steady) reasons.push("Hold the sign steady before capturing.");
  return { status: reasons.length === 0 ? "clean" : "low_quality", reasons };
}
