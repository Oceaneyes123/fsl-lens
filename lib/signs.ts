export type SignType = "alphabet" | "number";

export type Sign = {
  id: string;
  label: string;
  displayName: string;
  type: SignType;
  expectedHandCount: 1 | 2;
  referenceImageUrl: string;
  shortInstruction: string;
  commonMistakes: string;
};

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const alphabetSigns: Sign[] = alphabet.map((letter) => ({
  id: `alphabet_${letter}`,
  label: `alphabet_${letter}`,
  displayName: letter,
  type: "alphabet",
  expectedHandCount: 1,
  referenceImageUrl: `/references/alphabet-${letter.toLowerCase()}.png`,
  shortInstruction: `Form the FSL letter ${letter} and keep your hand steady inside the guide frame.`,
  commonMistakes: "Keep all visible fingers clearly separated from the background.",
}));

export const numberSigns: Sign[] = Array.from({ length: 11 }, (_, value) => ({
  id: `number_${value}`,
  label: `number_${value}`,
  displayName: String(value),
  type: "number",
  expectedHandCount: value === 10 ? 2 : 1,
  referenceImageUrl: `/references/number-${value}.png`,
  shortInstruction: `Form the FSL number ${value} and hold the sign still for a clear reading.`,
  commonMistakes: "Keep the whole hand inside the camera guide before capturing.",
}));

export const signs: Sign[] = [...alphabetSigns, ...numberSigns];

export function getSignByLabel(label: string): Sign | undefined {
  return signs.find((sign) => sign.label === label);
}

export function formatPredictedSign(label: string | null): { value: string; type: string } {
  if (!label) {
    return {
      value: "Unknown",
      type: "Predicted sign",
    };
  }

  const sign = getSignByLabel(label);

  if (sign) {
    return {
      value: sign.displayName,
      type: toTitleCase(sign.type),
    };
  }

  const [type, ...valueParts] = label.split("_");
  const value = valueParts.length > 0 ? valueParts.join(" ") : label;

  return {
    value: toTitleCase(value),
    type: toTitleCase(type),
  };
}

function toTitleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
