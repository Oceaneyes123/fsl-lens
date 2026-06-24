"""JSONL loading and PyTorch dataset adapters."""

import json
from pathlib import Path

import torch
import torch.nn.functional as functional
from torch.utils.data import Dataset

from .features import prepare_landmarks


def load_jsonl(path):
    with Path(path).open(encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def build_label_map(samples):
    return {label: index for index, label in enumerate(sorted({sample["sign_label"] for sample in samples}))}


class LandmarkDataset(Dataset):
    def __init__(self, samples, label_map, sequence_length=48, input_size=None):
        self.samples, self.label_map, self.sequence_length = samples, label_map, sequence_length
        self.input_size = input_size or max((prepare_landmarks(sample, sequence_length).shape[1] for sample in samples), default=1)

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, index):
        sample = self.samples[index]
        features = torch.tensor(prepare_landmarks(sample, self.sequence_length), dtype=torch.float32)
        features = functional.pad(features[:, :self.input_size], (0, max(0, self.input_size - features.shape[1])))
        return features, torch.tensor(self.label_map[sample["sign_label"]], dtype=torch.long)
