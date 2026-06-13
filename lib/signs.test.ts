import { describe, expect, it } from "vitest";
import {
  alphabetSigns,
  createWordSign,
  formatPredictedSign,
  formatPredictedSigns,
  getSignByLabel,
  numberSigns,
  signs,
} from "./signs";

describe("sign catalog", () => {
  it("contains 26 alphabet signs and 11 number signs", () => {
    expect(alphabetSigns).toHaveLength(26);
    expect(numberSigns).toHaveLength(11);
    expect(signs).toHaveLength(37);
  });

  it("uses stable MVP labels", () => {
    expect(getSignByLabel("alphabet_A")?.displayName).toBe("A");
    expect(getSignByLabel("number_10")?.displayName).toBe("10");
  });

  it("marks moving alphabet signs as dynamic while keeping static signs unchanged", () => {
    expect(getSignByLabel("alphabet_J")?.modality).toBe("dynamic");
    expect(getSignByLabel("alphabet_Z")?.modality).toBe("dynamic");
    expect(getSignByLabel("alphabet_A")?.modality).toBe("static");
  });
});

describe("formatPredictedSign", () => {
  it("uses the display name and type for known alphabet and number signs", () => {
    expect(formatPredictedSign("alphabet_A")).toEqual({
      value: "A",
      type: "Alphabet",
    });

    expect(formatPredictedSign("number_10")).toEqual({
      value: "10",
      type: "Number",
    });
  });

  it("formats future word labels without exposing raw IDs", () => {
    expect(formatPredictedSign("word_thank_you")).toEqual({
      value: "Thank You",
      type: "Word",
    });
  });

  it("returns an unknown display when there is no predicted label", () => {
    expect(formatPredictedSign(null)).toEqual({
      value: "Unknown",
      type: "Predicted sign",
    });
  });
});

describe("formatPredictedSigns", () => {
  it("returns unknown when the best prediction is below the display confidence threshold", () => {
    expect(formatPredictedSigns([{ label: "alphabet_A", confidence: 0.949 }])).toEqual({
      value: "Unknown",
      type: "Predicted sign",
    });
  });

  it("shows a single sign when it passes the display confidence threshold", () => {
    expect(formatPredictedSigns([{ label: "alphabet_A", confidence: 0.95 }])).toEqual({
      value: "A",
      type: "Alphabet",
    });
  });

  it("shows both alphabet and number predictions when both pass the display confidence threshold", () => {
    expect(
      formatPredictedSigns([
        { label: "alphabet_A", confidence: 0.97 },
        { label: "number_4", confidence: 0.96 },
        { label: "alphabet_B", confidence: 0.95 },
      ]),
    ).toEqual({
      value: "A / 4",
      type: "Predicted signs",
    });
  });
});

describe("createWordSign", () => {
  it("creates a stable word sign from typed text", () => {
    expect(createWordSign(" Thank you ")).toEqual({
      id: "word_thank_you",
      label: "word_thank_you",
      displayName: "Thank You",
      type: "word",
      modality: "dynamic",
      expectedHandCount: 1,
      referenceImageUrl: "",
      shortInstruction: "Sign the word Thank You with its full motion inside the guide frame.",
      commonMistakes: "Keep the full word sign motion clear inside the camera guide.",
    });
  });
});
