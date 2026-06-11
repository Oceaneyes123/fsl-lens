export type NormalizedLandmark = {
  x: number;
  y: number;
  z?: number;
};

const valuesPerLandmark = 3;
const guideInset = 0.12;
const steadyMovementThreshold = 0.025;

export function normalizeLandmarks(hands: NormalizedLandmark[][]): number[] {
  return hands.flatMap((hand) => normalizeHand(hand));
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
  oneHand: 21 * valuesPerLandmark,
  twoHands: 2 * 21 * valuesPerLandmark,
};
