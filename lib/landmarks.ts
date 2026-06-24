export type NormalizedLandmark = {
  x: number;
  y: number;
  z?: number;
};

const valuesPerLandmark = 3;
const guideInset = 0.12;
const steadyMovementThreshold = 0.025;

/** Number of finger features added per hand: 5 extension ratios + 4 pair cos-angles */
export const fingerFeatureCount = 9;

/** Wrist x/y and hand scale retain camera-relative sign location. */
export const locationFeatureCount = 3;

/** Total features per hand: normalized landmarks + finger shape + wrist location. */
export const featuresPerHand = 21 * valuesPerLandmark + fingerFeatureCount + locationFeatureCount;

/**
 * Feature version for model backward compatibility.
 * Increment when the feature vector shape changes.
 * v1 = initial (63 features per hand, no finger features)
 * v2 = finger features (71 = 63 + 8)
 * v3 = thumb-index angle added (72 = 63 + 9)
 * v4 = wrist x/y and hand scale added (75 = 63 + 9 + 3)
 */
export const featureVersion = 4;

// MediaPipe hand landmark indices
const THUMB_CMC = 1;
const THUMB_MCP = 2;
const THUMB_IP = 3;
const THUMB_TIP = 4;
const INDEX_MCP = 5;
const INDEX_PIP = 6;
const INDEX_DIP = 7;
const INDEX_TIP = 8;
const MIDDLE_MCP = 9;
const MIDDLE_PIP = 10;
const MIDDLE_DIP = 11;
const MIDDLE_TIP = 12;
const RING_MCP = 13;
const RING_PIP = 14;
const RING_DIP = 15;
const RING_TIP = 16;
const PINKY_MCP = 17;
const PINKY_PIP = 18;
const PINKY_DIP = 19;
const PINKY_TIP = 20;

type LandmarkIndex = [number, number, number, number]; // [MCP, PIP, DIP, TIP]

const fingerLandmarks: LandmarkIndex[] = [
  [THUMB_CMC, THUMB_MCP, THUMB_IP, THUMB_TIP],
  [INDEX_MCP, INDEX_PIP, INDEX_DIP, INDEX_TIP],
  [MIDDLE_MCP, MIDDLE_PIP, MIDDLE_DIP, MIDDLE_TIP],
  [RING_MCP, RING_PIP, RING_DIP, RING_TIP],
  [PINKY_MCP, PINKY_PIP, PINKY_DIP, PINKY_TIP],
];

const fingerPairLandmarks: [LandmarkIndex, LandmarkIndex][] = [
  [fingerLandmarks[0], fingerLandmarks[1]], // thumb-index
  [fingerLandmarks[1], fingerLandmarks[2]], // index-middle
  [fingerLandmarks[2], fingerLandmarks[3]], // middle-ring
  [fingerLandmarks[3], fingerLandmarks[4]], // ring-pinky
];

export function normalizeLandmarks(hands: NormalizedLandmark[][]): number[] {
  return orderHands(hands).flatMap((hand) => [...normalizeHand(hand), ...computeFingerFeatures(hand), ...computeLocationFeatures(hand)]);
}

export function orderHands(hands: NormalizedLandmark[][]): NormalizedLandmark[][] {
  return hands.length < 2 ? hands : [...hands].sort((left, right) => (left[0]?.x ?? 0) - (right[0]?.x ?? 0));
}

export function computeLocationFeatures(hand: NormalizedLandmark[]): number[] {
  const wrist = hand[0] ?? { x: 0, y: 0, z: 0 };
  const scale = Math.max(
    ...hand.map((point) => Math.hypot(point.x - wrist.x, point.y - wrist.y, (point.z ?? 0) - (wrist.z ?? 0))),
    0.0001,
  );
  return [roundFeature(wrist.x), roundFeature(wrist.y), roundFeature(scale)];
}

/**
 * Computes per-hand finger features:
 * - 5 extension ratios (tip-to-MCP / sum-of-segment-lengths, 1 = fully extended)
 * - 4 cosine angles between adjacent finger pairs (thumb-index, index-middle, middle-ring, ring-pinky)
 */
export function computeFingerFeatures(hand: NormalizedLandmark[]): number[] {
  const features: number[] = [];

  // Extension ratios for each finger
  for (const [mcp, pip, dip, tip] of fingerLandmarks) {
    const mcpPos = hand[mcp];
    const pipPos = hand[pip];
    const dipPos = hand[dip];
    const tipPos = hand[tip];

    if (!mcpPos || !pipPos || !dipPos || !tipPos) {
      features.push(0);
      continue;
    }

    const tipToMcp = dist3d(tipPos, mcpPos);
    const segment1 = dist3d(mcpPos, pipPos);
    const segment2 = dist3d(pipPos, dipPos);
    const segment3 = dist3d(dipPos, tipPos);
    const totalSegments = segment1 + segment2 + segment3;

    features.push(totalSegments > 0 ? roundFeature(tipToMcp / totalSegments) : 1);
  }

  // Cosine angles between adjacent finger direction vectors
  for (const [fingerA, fingerB] of fingerPairLandmarks) {
    const aMcp = hand[fingerA[0]];
    const aTip = hand[fingerA[3]];
    const bMcp = hand[fingerB[0]];
    const bTip = hand[fingerB[3]];

    if (!aMcp || !aTip || !bMcp || !bTip) {
      features.push(0);
      continue;
    }

    const dirA = normalize(sub3d(aTip, aMcp));
    const dirB = normalize(sub3d(bTip, bMcp));

    const cosAngle = clamp(dot3d(dirA, dirB), -1, 1);
    features.push(roundFeature(cosAngle));
  }

  return features;
}

export function areLandmarksInsideGuideFrame(hands: NormalizedLandmark[][], inset = guideInset) {
  return hands.every((hand) =>
    hand.every((point) => point.x >= inset && point.x <= 1 - inset && point.y >= inset && point.y <= 1 - inset),
  );
}

export function areLandmarksSteady(history: NormalizedLandmark[][][], threshold = steadyMovementThreshold) {
  if (history.length < 3) {
    return false;
  }

  const recent = history.slice(-3);
  const handCount = recent[0].length;

  if (recent.some((snapshot) => snapshot.length !== handCount)) {
    return false;
  }

  const movement = recent.slice(1).map((snapshot, snapshotIndex) => {
    const previous = recent[snapshotIndex];
    const distances: number[] = [];

    snapshot.forEach((hand, handIndex) => {
      hand.forEach((point, pointIndex) => {
        const previousPoint = previous[handIndex]?.[pointIndex];
        if (!previousPoint) {
          return;
        }

        distances.push(Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y));
      });
    });

    return average(distances);
  });

  return average(movement) <= threshold;
}

function normalizeHand(hand: NormalizedLandmark[]) {
  const wrist = hand[0] ?? { x: 0, y: 0, z: 0 };
  const scale = Math.max(
    ...hand.map((point) => Math.hypot(point.x - wrist.x, point.y - wrist.y, (point.z ?? 0) - (wrist.z ?? 0))),
    0.0001,
  );

  return hand.flatMap((point) => [
    roundFeature((point.x - wrist.x) / scale),
    roundFeature((point.y - wrist.y) / scale),
    roundFeature(((point.z ?? 0) - (wrist.z ?? 0)) / scale),
  ]);
}

// --- 3D vector helpers ---

function dist3d(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
}

function sub3d(a: NormalizedLandmark, b: NormalizedLandmark): { x: number; y: number; z: number } {
  return { x: a.x - b.x, y: a.y - b.y, z: (a.z ?? 0) - (b.z ?? 0) };
}

function dot3d(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function normalize(v: { x: number; y: number; z: number }): { x: number; y: number; z: number } {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundFeature(value: number) {
  return Math.round(value * 1000000) / 1000000;
}

export const landmarkFeatureSizes = {
  oneHand: 1 * featuresPerHand,
  twoHands: 2 * featuresPerHand,
};
