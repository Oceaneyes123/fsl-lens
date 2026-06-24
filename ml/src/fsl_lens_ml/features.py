"""Landmark sequence preprocessing shared by both neural baselines."""

import numpy as np


def resample_sequence(sequence, target_length=48):
    """Nearest-neighbor resampling that preserves endpoints."""
    values = np.asarray(sequence, dtype=np.float32)
    if target_length <= 0:
        raise ValueError("target_length must be positive")
    if values.size == 0:
        return np.zeros((target_length, 1), dtype=np.float32)
    if values.ndim == 1:
        values = values[:, None]
    indices = np.rint(np.linspace(0, len(values) - 1, target_length)).astype(int)
    return values[indices]


def flatten_landmark_frame(frame):
    """Flatten either a raw landmark frame or an extraction metadata frame."""
    landmarks = frame.get("landmarks", []) if isinstance(frame, dict) else frame
    values = []

    def append(value):
        if isinstance(value, dict):
            values.extend((value.get("x", 0), value.get("y", 0), value.get("z", 0)))
        elif isinstance(value, (list, tuple, np.ndarray)):
            for item in value:
                append(item)
        else:
            values.append(value)

    append(landmarks or [])
    return np.asarray(values, dtype=np.float32)


def prepare_landmarks(sample, target_length=48):
    """Convert static landmarks or dynamic frames to a fixed 2D tensor."""
    raw = sample.get("frames") if sample.get("modality") == "dynamic" else [sample.get("landmarks", [])]
    frames = [flatten_landmark_frame(frame) for frame in (raw or [])]
    width = max((len(frame) for frame in frames), default=1)
    padded = [np.pad(frame, (0, width - len(frame))) for frame in frames]
    return resample_sequence(padded, target_length)

