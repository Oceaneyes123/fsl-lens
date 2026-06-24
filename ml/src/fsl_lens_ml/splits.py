"""Dataset splitting without signer leakage."""

import random


def signer_independent_split(samples, train_ratio=0.7, val_ratio=0.15, test_ratio=0.15, signer_key="contributor_id", seed=42):
    if abs(train_ratio + val_ratio + test_ratio - 1.0) > 1e-9:
        raise ValueError("split ratios must sum to 1")
    groups = {}
    unknown = []
    for sample in samples:
        signer = sample.get(signer_key)
        if signer in (None, "") or str(signer).casefold() == "unknown":
            unknown.append(sample)
        else:
            groups.setdefault(str(signer), []).append(sample)
    signers = list(groups)
    random.Random(seed).shuffle(signers)
    train_end = round(len(signers) * train_ratio)
    val_end = train_end + round(len(signers) * val_ratio)
    train_ids, val_ids, test_ids = signers[:train_end], signers[train_end:val_end], signers[val_end:]
    collect = lambda ids: [sample for signer in ids for sample in groups[signer]]
    return collect(train_ids) + unknown, collect(val_ids), collect(test_ids)

