"""Validate an export and materialize fixed-length features as JSONL."""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))
from fsl_lens_ml.dataset import load_jsonl
from fsl_lens_ml.features import prepare_landmarks


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input")
    parser.add_argument("--out", required=True)
    parser.add_argument("--sequence-length", type=int, default=48)
    args = parser.parse_args()
    rows = [{**sample, "features": prepare_landmarks(sample, args.sequence_length).tolist()} for sample in load_jsonl(args.input)]
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out).write_text("".join(json.dumps(row) + "\n" for row in rows), encoding="utf-8")


if __name__ == "__main__":
    main()

