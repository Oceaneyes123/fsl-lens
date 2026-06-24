"""Train a compact Transformer baseline."""

import argparse
import sys
from pathlib import Path

import torch
from torch.utils.data import DataLoader

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))
from fsl_lens_ml.dataset import LandmarkDataset, build_label_map, load_jsonl
from fsl_lens_ml.health import build_health_report
from fsl_lens_ml.metrics import classification_metrics
from fsl_lens_ml.models import TransformerClassifier, train_epoch


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input")
    parser.add_argument("--val")
    parser.add_argument("--out", default="ml/models/transformer_experiment.pt")
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--sequence-length", type=int, default=48)
    parser.add_argument("--hidden-size", type=int, default=128)
    parser.add_argument("--layers", type=int, default=2)
    parser.add_argument("--heads", type=int, default=4)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--device", default="cpu")
    args = parser.parse_args()
    samples = load_jsonl(args.input)
    if not samples:
        raise ValueError("Training dataset is empty")
    labels = build_label_map(samples)
    dataset = LandmarkDataset(samples, labels, args.sequence_length)
    device = torch.device(args.device)
    if device.type == "cuda" and not torch.cuda.is_available():
        raise ValueError("CUDA was requested but is not available")
    model = TransformerClassifier(dataset.input_size, len(labels), args.hidden_size, args.heads, args.layers).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr)
    loader = DataLoader(dataset, batch_size=args.batch_size, shuffle=True)
    for warning in build_health_report(samples)["warnings"]:
        print(f"Warning: {warning}")

    validation = None
    if args.val and Path(args.val).is_file():
        validation_samples = [sample for sample in load_jsonl(args.val) if sample["sign_label"] in labels]
        if validation_samples:
            validation = DataLoader(LandmarkDataset(validation_samples, labels, args.sequence_length, dataset.input_size), batch_size=args.batch_size)
        else:
            print("Warning: validation dataset has no usable samples; training without validation.")
    elif args.val:
        print(f"Warning: validation file not found: {args.val}")

    for epoch in range(args.epochs):
        loss = train_epoch(model, loader, optimizer, device)
        print(f"epoch={epoch + 1} train_loss={loss:.4f}")
        if validation:
            model.eval()
            logits, targets = [], []
            with torch.no_grad():
                for features, target in validation:
                    logits.extend(model(features.to(device)).cpu().tolist())
                    targets.extend(target.tolist())
            metrics = classification_metrics(logits, targets, len(labels))
            print(f"epoch={epoch + 1} val_top1={metrics['top1_accuracy']:.4f} val_top3={metrics['top3_accuracy']:.4f}")
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    config = {"sequence_length": args.sequence_length, "hidden_size": args.hidden_size, "layers": args.layers, "heads": args.heads, "lr": args.lr}
    torch.save({"state_dict": model.state_dict(), "model_type": "transformer", "input_size": dataset.input_size, "class_count": len(labels), "label_map": labels, "config": config}, args.out)


if __name__ == "__main__":
    main()

