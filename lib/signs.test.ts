import { describe, expect, it } from "vitest";
import { alphabetSigns, formatPredictedSign, getSignByLabel, numberSigns, signs } from "./signs";

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
