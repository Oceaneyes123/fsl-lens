"""Create deterministic signer-independent JSONL splits."""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))
from fsl_lens_ml.dataset import load_jsonl
from fsl_lens_ml.splits import signer_independent_split


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input")
    parser.add_argument("--out-dir", default="ml/datasets/splits")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    output = Path(args.out_dir)
    output.mkdir(parents=True, exist_ok=True)
    for name, rows in zip(("train", "val", "test"), signer_independent_split(load_jsonl(args.input), seed=args.seed)):
        (output / f"{name}.jsonl").write_text("".join(json.dumps(row) + "\n" for row in rows), encoding="utf-8")


if __name__ == "__main__":
    main()

