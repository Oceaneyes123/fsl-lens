"""Generate JSON and console dataset health reports."""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))
from fsl_lens_ml.dataset import load_jsonl
from fsl_lens_ml.health import build_health_report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input")
    parser.add_argument("--out", required=True)
    parser.add_argument("--min-samples-per-sign", type=int, default=30)
    parser.add_argument("--min-signers-per-sign", type=int, default=3)
    args = parser.parse_args()
    report = build_health_report(load_jsonl(args.input), args.min_samples_per_sign, args.min_signers_per_sign)
    output = Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    print("Dataset Health\n--------------")
    print(f"Total samples: {report['total_samples']}")
    print(f"Total signs: {report['total_signs']}")
    print(f"Total contributors: {report['total_contributors']}")
    print("\nWeak signs:")
    for sign in report["weak_signs"]:
        print(f"- {sign['sign_label']}: {sign['sample_count']} samples, {sign['signer_count']} signers")
    for warning in report["warnings"]:
        print(f"Warning: {warning}")


if __name__ == "__main__":
    main()
