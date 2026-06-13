import { normalizeLandmarks, type NormalizedLandmark } from "./landmarks";

export type LandmarkFrame = NormalizedLandmark[][];

export const dynamicSequenceDefaults = {
  targetFrameCount: 30,
};

export function resampleLandmarkFrames(frames: LandmarkFrame[], targetFrameCount = dynamicSequenceDefaults.targetFrameCount) {
  if (frames.length === 0 || targetFrameCount <= 0) {
    return [];
  }

  if (targetFrameCount === 1) {
    return [frames[0]];
  }

  return Array.from({ length: targetFrameCount }, (_, index) => {
    const sourceIndex = Math.round((index * (frames.length - 1)) / (targetFrameCount - 1));
    return frames[sourceIndex];
  });
}

export function normalizeDynamicSequence(
  frames: LandmarkFrame[],
  { targetFrameCount = dynamicSequenceDefaults.targetFrameCount }: { targetFrameCount?: number } = {},
) {
  const resampledFrames = resampleLandmarkFrames(frames, targetFrameCount);

  if (resampledFrames.length === 0) {
    return [];
  }

  return resampledFrames.flatMap((frame, frameIndex) => {
    const normalized = normalizeLandmarks(frame);
    const previousFrame = frameIndex === 0 ? null : resampledFrames[frameIndex - 1];
    const deltas = previousFrame ? calculateFrameDeltas(previousFrame, frame) : Array(normalized.length).fill(0);
    return [...normalized, ...deltas];
  });
}

function calculateFrameDeltas(previousFrame: LandmarkFrame, frame: LandmarkFrame) {
  return frame.flatMap((hand, handIndex) =>
    hand.flatMap((point, pointIndex) => {
      const previousPoint = previousFrame[handIndex]?.[pointIndex] ?? point;
      return [
        roundFeature(point.x - previousPoint.x),
        roundFeature(point.y - previousPoint.y),
        roundFeature((point.z ?? 0) - (previousPoint.z ?? 0)),
      ];
    }),
  );
}

function roundFeature(value: number) {
  return Math.round(value * 1000000) / 1000000;
}
