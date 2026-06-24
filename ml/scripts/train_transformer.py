"""Train a compact Transformer baseline."""

import argparse
import sys
from pathlib import Path

import torch
from torch.utils.data import DataLoader

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))
from fsl_lens_ml.dataset import LandmarkDataset, build_label_map, load_jsonl
from fsl_lens_ml.models import TransformerClassifier, train_epoch


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input")
    parser.add_argument("--out", default="ml/models/transformer.pt")
    parser.add_argument("--epochs", type=int, default=10)
    args = parser.parse_args()
    samples = load_jsonl(args.input)
    labels = build_label_map(samples)
    dataset = LandmarkDataset(samples, labels)
    model = TransformerClassifier(dataset.input_size, len(labels))
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    for epoch in range(args.epochs):
        print(f"epoch={epoch + 1} loss={train_epoch(model, DataLoader(dataset, batch_size=32, shuffle=True), optimizer):.4f}")
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    torch.save({"state_dict": model.state_dict(), "model_type": "transformer", "input_size": dataset.input_size, "class_count": len(labels), "label_map": labels}, args.out)


if __name__ == "__main__":
    main()

