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


def prepare_landmarks(sample, target_length=48):
    """Convert static landmarks or dynamic frames to a fixed 2D tensor."""
    raw = sample.get("frames") if sample.get("modality") == "dynamic" else [sample.get("landmarks", [])]
    frames = [np.asarray(frame, dtype=np.float32).reshape(-1) for frame in (raw or [])]
    width = max((len(frame) for frame in frames), default=1)
    padded = [np.pad(frame, (0, width - len(frame))) for frame in frames]
    return resample_sequence(padded, target_length)

