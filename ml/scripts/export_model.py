"""Export a trained baseline to TorchScript; ONNX/browser export comes later."""

import argparse
from pathlib import Path

import torch


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("model")
    parser.add_argument("--out", default="ml/models/model.torchscript")
    args = parser.parse_args()
    checkpoint = torch.load(args.model, map_location="cpu", weights_only=True)
    from sys import path
    path.insert(0, str(Path(__file__).parents[1] / "src"))
    from fsl_lens_ml.models import BiLSTMClassifier, TransformerClassifier
    model_class = BiLSTMClassifier if checkpoint["model_type"] == "bilstm" else TransformerClassifier
    model = model_class(checkpoint["input_size"], checkpoint["class_count"])
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    torch.jit.trace(model, torch.zeros(1, 48, checkpoint["input_size"])).save(args.out)


if __name__ == "__main__":
    main()

