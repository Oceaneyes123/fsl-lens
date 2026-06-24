"""Dataset health summaries for landmark JSONL samples."""

from collections import Counter, defaultdict
from statistics import median


def build_health_report(samples, min_samples_per_sign=30, min_signers_per_sign=3):
    samples_per_sign = Counter(sample["sign_label"] for sample in samples)
    samples_per_contributor = Counter(
        str(sample.get("contributor_id"))
        for sample in samples
        if sample.get("contributor_id") not in (None, "", "unknown")
    )
    signers = defaultdict(set)
    for sample in samples:
        contributor = sample.get("contributor_id")
        if contributor not in (None, "", "unknown"):
            signers[sample["sign_label"]].add(str(contributor))
    signers_per_sign = {label: len(signers[label]) for label in sorted(samples_per_sign)}
    frame_counts = [int(sample.get("frame_count", len(sample.get("frames", [])))) for sample in samples]

    weak_signs = []
    for label in sorted(samples_per_sign):
        reasons = []
        if samples_per_sign[label] < min_samples_per_sign:
            reasons.append(f"sample_count_below_{min_samples_per_sign}")
        if signers_per_sign[label] < min_signers_per_sign:
            reasons.append(f"signer_count_below_{min_signers_per_sign}")
        if reasons:
            weak_signs.append({
                "sign_label": label,
                "sample_count": samples_per_sign[label],
                "signer_count": signers_per_sign[label],
                "reason": ";".join(reasons),
            })

    warnings = []
    if len(samples_per_contributor) < 5:
        warnings.append(f"Only {len(samples_per_contributor)} known contributors found. Transformer results may not generalize.")
    if len(samples_per_sign) < 10:
        warnings.append(f"Only {len(samples_per_sign)} signs found. The experiment covers a limited vocabulary.")
    if samples_per_sign and median(samples_per_sign.values()) < 20:
        warnings.append("Median samples per sign is below 20.")

    return {
        "total_samples": len(samples),
        "total_signs": len(samples_per_sign),
        "total_contributors": len(samples_per_contributor),
        "samples_per_sign": dict(sorted(samples_per_sign.items())),
        "signers_per_sign": signers_per_sign,
        "samples_per_contributor": dict(sorted(samples_per_contributor.items())),
        "frame_count": {
            "min": min(frame_counts, default=0),
            "max": max(frame_counts, default=0),
            "average": sum(frame_counts) / len(frame_counts) if frame_counts else 0,
        },
        "weak_signs": weak_signs,
        "warnings": warnings,
    }
