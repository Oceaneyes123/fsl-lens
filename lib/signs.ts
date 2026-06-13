export type SignType = "alphabet" | "number" | "word";
export type SignModality = "static" | "dynamic";

export type Sign = {
  id: string;
  label: string;
  displayName: string;
  type: SignType;
  modality: SignModality;
  expectedHandCount: 1 | 2;
  referenceImageUrl: string;
  shortInstruction: string;
  commonMistakes: string;
};

type Prediction = {
  label: string;
  confidence: number;
};

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const dynamicAlphabetSigns = new Set(["J", "Z"]);

export const alphabetSigns: Sign[] = alphabet.map((letter) => ({
  id: `alphabet_${letter}`,
  label: `alphabet_${letter}`,
  displayName: letter,
  type: "alphabet",
  modality: dynamicAlphabetSigns.has(letter) ? "dynamic" : "static",
  expectedHandCount: 1,
  referenceImageUrl: `/references/alphabet-${letter.toLowerCase()}.png`,
  shortInstruction: dynamicAlphabetSigns.has(letter)
    ? `Sign the FSL letter ${letter} with its full motion inside the guide frame.`
    : `Form the FSL letter ${letter} and keep your hand steady inside the guide frame.`,
  commonMistakes: dynamicAlphabetSigns.has(letter)
    ? "Keep the full letter motion clear inside the camera guide."
    : "Keep all visible fingers clearly separated from the background.",
}));

export const numberSigns: Sign[] = Array.from({ length: 11 }, (_, value) => ({
  id: `number_${value}`,
  label: `number_${value}`,
  displayName: String(value),
  type: "number",
  modality: "static",
  expectedHandCount: value === 10 ? 2 : 1,
  referenceImageUrl: `/references/number-${value}.png`,
  shortInstruction: `Form the FSL number ${value} and hold the sign still for a clear reading.`,
  commonMistakes: "Keep the whole hand inside the camera guide before capturing.",
}));

export const signs: Sign[] = [...alphabetSigns, ...numberSigns];

export function getSignByLabel(label: string): Sign | undefined {
  return signs.find((sign) => sign.label === label);
}

export function createWordSign(value: string): Sign {
  const displayName = toTitleCase(value);
  const slug = displayName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const label = `word_${slug}`;

  return {
    id: label,
    label,
    displayName,
    type: "word",
    modality: "dynamic",
    expectedHandCount: 1,
    referenceImageUrl: "",
    shortInstruction: `Sign the word ${displayName} with its full motion inside the guide frame.`,
    commonMistakes: "Keep the full word sign motion clear inside the camera guide.",
  };
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

export function formatPredictedSigns(predictions: Prediction[], minimumConfidence = 0.95): { value: string; type: string } {
  const confidentPredictions = predictions
    .filter((prediction) => prediction.confidence >= minimumConfidence)
    .sort((a, b) => b.confidence - a.confidence);

  if (confidentPredictions.length === 0) {
    return formatPredictedSign(null);
  }

  const alphabetPrediction = findPredictionByType(confidentPredictions, "alphabet");
  const numberPrediction = findPredictionByType(confidentPredictions, "number");

  if (alphabetPrediction && numberPrediction) {
    const alphabetSign = formatPredictedSign(alphabetPrediction.label);
    const numberSign = formatPredictedSign(numberPrediction.label);

    return {
      value: `${alphabetSign.value} / ${numberSign.value}`,
      type: "Predicted signs",
    };
  }

  return formatPredictedSign(confidentPredictions[0].label);
}

function findPredictionByType(predictions: Prediction[], type: SignType) {
  return predictions.find((prediction) => getSignByLabel(prediction.label)?.type === type);
}

function toTitleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
