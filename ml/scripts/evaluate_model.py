"""Evaluate a saved baseline on JSONL samples."""

import argparse
import json
import sys
from pathlib import Path

import torch
from torch.utils.data import DataLoader

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))
from fsl_lens_ml.dataset import LandmarkDataset, load_jsonl
from fsl_lens_ml.metrics import classification_metrics
from fsl_lens_ml.models import BiLSTMClassifier, TransformerClassifier


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("model")
    parser.add_argument("dataset")
    parser.add_argument("--out", default="ml/reports/evaluation.json")
    args = parser.parse_args()
    checkpoint = torch.load(args.model, map_location="cpu", weights_only=True)
    dataset = LandmarkDataset(load_jsonl(args.dataset), checkpoint["label_map"])
    model_class = BiLSTMClassifier if checkpoint["model_type"] == "bilstm" else TransformerClassifier
    model = model_class(checkpoint["input_size"], checkpoint["class_count"])
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()
    logits, labels = [], []
    with torch.no_grad():
        for features, target in DataLoader(dataset, batch_size=64):
            logits.extend(model(features).tolist())
            labels.extend(target.tolist())
    report = classification_metrics(logits, labels)
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out).write_text(json.dumps(report, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()

