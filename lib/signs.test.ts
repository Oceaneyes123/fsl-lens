import { describe, expect, it } from "vitest";
import { alphabetSigns, getSignByLabel, numberSigns, signs } from "./signs";

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
