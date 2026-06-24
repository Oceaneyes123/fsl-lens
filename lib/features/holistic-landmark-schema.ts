import type { LandmarkSnapshot } from "@/lib/detection/landmark-snapshot";

export const handLandmarkCount = 21;
export const poseLandmarkCount = 33;

export type LandmarkPoint = { x: number; y: number; z: number; visibility?: number };
export type HolisticFrame = {
  leftHand: LandmarkPoint[];
  rightHand: LandmarkPoint[];
  pose: LandmarkPoint[];
  face?: LandmarkPoint[];
  handedness: string[];
  confidence: number;
  missing: { leftHand: boolean; rightHand: boolean; pose: boolean; face: boolean };
};
export type HolisticSequence = { schemaVersion: "holistic_v2"; frames: HolisticFrame[]; fps?: number };

const emptyPoint = (): LandmarkPoint => ({ x: 0, y: 0, z: 0 });
export const createEmptyHandLandmarks = () => Array.from({ length: handLandmarkCount }, emptyPoint);
export const createEmptyPoseLandmarks = () => Array.from({ length: poseLandmarkCount }, emptyPoint);

function padded(points: { x: number; y: number; z?: number; visibility?: number }[] | undefined, count: number) {
  return [...(points ?? []).slice(0, count).map((point) => ({ x: point.x, y: point.y, z: point.z ?? 0, ...(point.visibility === undefined ? {} : { visibility: point.visibility }) })), ...Array.from({ length: Math.max(0, count - (points?.length ?? 0)) }, emptyPoint)];
}

export function fromHandOnlySnapshot(snapshot: LandmarkSnapshot): HolisticFrame {
  const leftIndex = snapshot.handedness.findIndex((value) => value.toLowerCase() === "left");
  const rightIndex = snapshot.handedness.findIndex((value) => value.toLowerCase() === "right");
  const left = leftIndex >= 0 ? snapshot.landmarks[leftIndex] : undefined;
  const right = rightIndex >= 0 ? snapshot.landmarks[rightIndex] : snapshot.landmarks[left ? -1 : 0];
  return {
    leftHand: padded(left, handLandmarkCount),
    rightHand: padded(right, handLandmarkCount),
    pose: createEmptyPoseLandmarks(),
    handedness: [...snapshot.handedness],
    confidence: snapshot.confidence,
    missing: { leftHand: !left, rightHand: !right, pose: true, face: true },
  };
}
