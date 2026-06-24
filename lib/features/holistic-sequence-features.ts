import type { HolisticFrame, HolisticSequence, LandmarkPoint } from "./holistic-landmark-schema";

export function resampleHolisticSequence(sequence: HolisticSequence, targetFrameCount: number): HolisticSequence {
  if (targetFrameCount <= 0 || sequence.frames.length === 0) return { ...sequence, frames: [] };
  if (targetFrameCount === 1) return { ...sequence, frames: [sequence.frames[0]] };
  return { ...sequence, frames: Array.from({ length: targetFrameCount }, (_, index) => sequence.frames[Math.round(index * (sequence.frames.length - 1) / (targetFrameCount - 1))]) };
}

const flattenPoints = (points: LandmarkPoint[]) => points.flatMap((point) => [point.x, point.y, point.z, point.visibility ?? 0]);
const flattenFrame = (frame: HolisticFrame) => [
  ...flattenPoints(frame.leftHand),
  ...flattenPoints(frame.rightHand),
  ...flattenPoints(frame.pose),
  Number(frame.missing.leftHand), Number(frame.missing.rightHand), Number(frame.missing.pose), Number(frame.missing.face),
  frame.confidence,
];
export const flattenHolisticSequence = (sequence: HolisticSequence) => sequence.frames.flatMap(flattenFrame);

